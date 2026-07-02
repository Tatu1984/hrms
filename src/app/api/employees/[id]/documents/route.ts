import { NextRequest, NextResponse } from 'next/server';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { saveUpload } from '@/lib/storage';
import { DocumentType } from '@prisma/client';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/employees/[id]/documents - Get all documents for an employee
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

    const { id: employeeId } = params;

    // Authorization
    if (
      session.role !== 'ADMIN' &&
      session.role !== 'MANAGER' &&
      session.employeeId !== employeeId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const documents = await prisma.employeeDocument.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/employees/[id]/documents - Upload a new document
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId } = params;

    // Authorization
    if (session.role !== 'ADMIN' && session.employeeId !== employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const documentName = formData.get('documentName') as string;
    const documentNumber = formData.get('documentNumber') as string | null;
    const issuedDate = formData.get('issuedDate') as string | null;
    const expiryDate = formData.get('expiryDate') as string | null;
    const issuingAuthority = formData.get('issuingAuthority') as string | null;
    const notes = formData.get('notes') as string | null;

    if (documentType && !Object.values(DocumentType).includes(documentType as DocumentType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }

    if (!file || !documentType || !documentName) {
      return NextResponse.json(
        { error: 'File, document type, and document name are required' },
        { status: 400 }
      );
    }

    // Persist to Blob (prod) / disk (dev). Never use the client filename in the
    // path — generate a safe unique name, keeping only a whitelisted extension.
    const ext = extname(file.name).match(/^\.[a-z0-9]{1,5}$/i)?.[0] ?? '';
    const storedName = `${randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await saveUpload(buffer, `documents/${employeeId}`, storedName, file.type);

    // Create database record
    const document = await prisma.employeeDocument.create({
      data: {
        employeeId,
        documentType: documentType as DocumentType,
        documentName,
        fileName: file.name,
        fileUrl: url,
        fileSize: file.size,
        mimeType: file.type,
        documentNumber,
        issuedDate: issuedDate ? new Date(issuedDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        issuingAuthority,
        notes,
        uploadedBy: session.employeeId || session.userId,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
