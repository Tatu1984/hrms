import { NextRequest, NextResponse } from 'next/server';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { requireAuth } from '@/lib/api-auth';
import { saveUpload } from '@/lib/storage';

// Only allow a safe, fixed set of upload categories — never trust the raw value.
const ALLOWED_TYPES = new Set(['aadhaar', 'pan', 'passport', 'kyc', 'photo', 'document']);

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const rawType = formData.get('type') as string;
    const type = ALLOWED_TYPES.has(rawType) ? rawType : 'document';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF, JPG, and PNG are allowed' }, { status: 400 });
    }

    // Generate a safe, unique filename. Never use the client-supplied name in
    // the path (path-traversal / overwrite risk); keep only a whitelisted ext.
    const extByMime: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
    };
    const ext = extByMime[file.type] ?? (extname(file.name).match(/^\.[a-z0-9]{1,5}$/i)?.[0] ?? '');
    const fileName = `${type}_${randomUUID()}${ext}`;

    // Persist to Blob (prod) or local disk (dev) — serverless FS is ephemeral.
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await saveUpload(buffer, 'kyc', fileName, file.type);

    return NextResponse.json({ path: url }, { status: 200 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
