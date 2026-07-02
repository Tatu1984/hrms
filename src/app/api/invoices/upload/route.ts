import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { saveUpload } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const invoiceNumber = formData.get('invoiceNumber') as string;
    const clientName = formData.get('clientName') as string;
    const amount = formData.get('amount') as string;
    const currency = formData.get('currency') as string || 'USD';
    const dueDate = formData.get('dueDate') as string | null;

    if (!file || !invoiceNumber || !clientName || !amount) {
      return NextResponse.json(
        { error: 'File, invoice number, client name, and amount are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt || '')) {
      return NextResponse.json(
        { error: `Invalid file type. Only PDF, PNG, and JPG files are allowed. Received: ${file.type}` },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename and persist to Blob (prod) / disk (dev).
    const safeExt = (fileExt || 'pdf').replace(/[^a-z0-9]/gi, '');
    const fileName = `${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${safeExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url: relativeFilePath } = await saveUpload(buffer, 'invoices', fileName, file.type);

    // Create invoice record in database
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientName,
        clientEmail: '',
        clientAddress: '',
        amount: parseFloat(amount),
        currency: currency,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'DRAFT',
        items: [],
        fileUrl: relativeFilePath,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Invoice uploaded successfully',
      invoice,
      fileUrl: relativeFilePath,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to upload invoice', details: errorMessage },
      { status: 500 }
    );
  }
}
