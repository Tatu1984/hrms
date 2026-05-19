import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Helper function to create a voucher entry for the accounting system
async function createVoucherForAccountEntry(
  type: 'INCOME' | 'EXPENSE',
  amount: number,
  date: Date,
  description: string,
  reference?: string | null,
  categoryName?: string
) {
  try {
    // Get or create fiscal year
    let fiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    if (!fiscalYear) {
      // Create a default fiscal year if none exists
      const year = date.getFullYear();
      const month = date.getMonth();
      // Indian fiscal year: April to March
      const fyStartYear = month >= 3 ? year : year - 1;
      fiscalYear = await prisma.fiscalYear.create({
        data: {
          name: `${fyStartYear}-${(fyStartYear + 1).toString().slice(-2)}`,
          startDate: new Date(fyStartYear, 3, 1), // April 1
          endDate: new Date(fyStartYear + 1, 2, 31), // March 31
        },
      });
    }

    // Get or create voucher type
    const voucherTypeCode = type === 'INCOME' ? 'RCPT' : 'PYMT';
    let voucherType = await prisma.voucherType.findUnique({
      where: { code: voucherTypeCode },
    });

    if (!voucherType) {
      voucherType = await prisma.voucherType.create({
        data: {
          name: type === 'INCOME' ? 'Receipt' : 'Payment',
          code: voucherTypeCode,
          nature: type === 'INCOME' ? 'RECEIPT' : 'PAYMENT',
          numberingPrefix: voucherTypeCode,
          autoNumbering: true,
        },
      });
    }

    // Get or create ledgers
    // 1. Cash/Bank ledger (default)
    let cashLedger = await prisma.ledger.findFirst({
      where: { name: 'Cash' },
    });

    if (!cashLedger) {
      // Create Cash & Bank ledger group first
      let cashGroup = await prisma.ledgerGroup.findFirst({
        where: { name: 'Cash & Bank' },
      });

      if (!cashGroup) {
        cashGroup = await prisma.ledgerGroup.create({
          data: {
            name: 'Cash & Bank',
            nature: 'ASSETS',
            isSystem: true,
          },
        });
      }

      cashLedger = await prisma.ledger.create({
        data: {
          name: 'Cash',
          groupId: cashGroup.id,
          isActive: true,
        },
      });
    }

    // 2. Income/Expense ledger based on category
    const ledgerGroupNature = type === 'INCOME' ? 'INCOME' : 'EXPENSES';
    const ledgerGroupName = type === 'INCOME' ? 'Direct Income' : 'Direct Expenses';

    let transactionGroup = await prisma.ledgerGroup.findFirst({
      where: { nature: ledgerGroupNature },
    });

    if (!transactionGroup) {
      transactionGroup = await prisma.ledgerGroup.create({
        data: {
          name: ledgerGroupName,
          nature: ledgerGroupNature,
          isSystem: true,
        },
      });
    }

    const ledgerName = categoryName || (type === 'INCOME' ? 'General Income' : 'General Expenses');
    let transactionLedger = await prisma.ledger.findFirst({
      where: {
        name: ledgerName,
        groupId: transactionGroup.id,
      },
    });

    if (!transactionLedger) {
      transactionLedger = await prisma.ledger.create({
        data: {
          name: ledgerName,
          groupId: transactionGroup.id,
          isActive: true,
        },
      });
    }

    // Generate voucher number
    const lastVoucher = await prisma.voucher.findFirst({
      where: { voucherTypeId: voucherType.id },
      orderBy: { createdAt: 'desc' },
    });

    const nextNumber = lastVoucher
      ? parseInt(lastVoucher.voucherNumber.split('/').pop() || '0') + 1
      : 1;

    const voucherNumber = `${voucherType.numberingPrefix}/${fiscalYear.name}/${nextNumber.toString().padStart(5, '0')}`;

    // Create voucher with double-entry
    // For INCOME: Debit Cash, Credit Income
    // For EXPENSE: Debit Expense, Credit Cash
    const voucher = await prisma.voucher.create({
      data: {
        voucherTypeId: voucherType.id,
        fiscalYearId: fiscalYear.id,
        voucherNumber,
        date,
        narration: description,
        referenceNo: reference,
        totalDebit: amount,
        totalCredit: amount,
        status: 'APPROVED',
        isPosted: true,
        postedAt: new Date(),
        entries: {
          create: type === 'INCOME'
            ? [
                { ledgerId: cashLedger.id, debitAmount: amount, creditAmount: 0, sequence: 1 },
                { ledgerId: transactionLedger.id, debitAmount: 0, creditAmount: amount, sequence: 2 },
              ]
            : [
                { ledgerId: transactionLedger.id, debitAmount: amount, creditAmount: 0, sequence: 1 },
                { ledgerId: cashLedger.id, debitAmount: 0, creditAmount: amount, sequence: 2 },
              ],
        },
      },
    });

    // Update ledger balances
    // Cash: Increases on income (debit), decreases on expense (credit)
    await prisma.ledger.update({
      where: { id: cashLedger.id },
      data: {
        currentBalance: {
          increment: type === 'INCOME' ? amount : -amount,
        },
      },
    });

    // Transaction ledger: Income increases with credit, Expense increases with debit
    await prisma.ledger.update({
      where: { id: transactionLedger.id },
      data: {
        currentBalance: {
          increment: amount,
        },
      },
    });

    return voucher;
  } catch (error) {
    console.error('Error creating voucher for account entry:', error);
    // Don't throw - we still want the account entry to be created even if voucher fails
    return null;
  }
}

// GET /api/accounts - Get all account transactions
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // INCOME or EXPENSE
    const categoryId = searchParams.get('categoryId');

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const accounts = await prisma.account.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

// POST /api/accounts - Create new account transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      categoryId,
      amount,
      date,
      description,
      reference,
      paymentPurpose,
      paymentMode,
      senderName,
      bankInfo,
      paymentTo,
      paymentCategory
    } = body;

    if (!type || !categoryId || !amount || !date || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get category name for ledger creation
    const category = await prisma.accountCategory.findUnique({
      where: { id: categoryId },
    });

    const account = await prisma.account.create({
      data: {
        type,
        categoryId,
        amount: parseFloat(amount),
        currency: 'INR',
        date: new Date(date),
        description,
        reference: reference || null,
        paymentPurpose: paymentPurpose || null,
        paymentMode: paymentMode || null,
        senderName: senderName || null,
        bankInfo: bankInfo || null,
        paymentTo: paymentTo || null,
        paymentCategory: paymentCategory || null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Also create a voucher entry in the accounting system
    // This connects the quick entry to the full double-entry accounting
    const voucher = await createVoucherForAccountEntry(
      type as 'INCOME' | 'EXPENSE',
      parseFloat(amount),
      new Date(date),
      description,
      reference,
      category?.name
    );

    return NextResponse.json({ success: true, account, voucherId: voucher?.id }, { status: 201 });
  } catch (error) {
    console.error('Create account error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

// PUT /api/accounts - Update account transaction
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, type, categoryId, amount, date, description, reference } = body;

    if (!id) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    const updateData: any = {};

    if (type) updateData.type = type;
    if (categoryId) updateData.categoryId = categoryId;
    if (amount) updateData.amount = parseFloat(amount);
    if (date) updateData.date = new Date(date);
    if (description !== undefined) updateData.description = description;
    if (reference !== undefined) updateData.reference = reference;

    const account = await prisma.account.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, account });
  } catch (error) {
    console.error('Update account error:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}

// DELETE /api/accounts - Delete account transaction
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    await prisma.account.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
