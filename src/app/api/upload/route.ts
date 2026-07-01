import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { requireAuth } from '@/lib/api-auth';

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

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'kyc');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
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
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the public path
    const publicPath = `/uploads/kyc/${fileName}`;

    return NextResponse.json({ path: publicPath }, { status: 200 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
