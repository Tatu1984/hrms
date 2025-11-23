import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};


export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, paidAmount, paidDate } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;
    }

    if (status === 'PAID') {
      if (!paidAmount || !paidDate) {
        return NextResponse.json(
          { error: 'Paid amount and date are required when marking as PAID' },
          { status: 400 }
        );
      }
      updateData.paidAmount = parseFloat(paidAmount);
      updateData.paidDate = new Date(paidDate);

      // Create transaction in Account when invoice is marked as paid
      await prisma.transaction.create({
        data: {
          type: 'CREDIT',
          category: 'INVOICE_PAYMENT',
          amount: parseFloat(paidAmount),
          description: `Payment received for invoice ${(await prisma.invoice.findUnique({ where: { id } }))?.invoiceNumber}`,
          date: new Date(paidDate),
          status: 'COMPLETED',
        },
      });
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}
