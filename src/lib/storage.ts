import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

export interface SaveResult {
  url: string;
}

/**
 * Persist an uploaded file and return a public URL.
 *
 * In production on Vercel the filesystem is ephemeral, so when
 * BLOB_READ_WRITE_TOKEN is configured we store to Vercel Blob. Otherwise (local
 * dev, or token not set) we fall back to public/uploads on disk.
 *
 * @param subdir  logical folder, e.g. 'kyc' | 'invoices' | 'documents'
 * @param filename  already-sanitized, unique filename (no path separators)
 */
export async function saveUpload(
  buffer: Buffer,
  subdir: string,
  filename: string,
  contentType?: string,
): Promise<SaveResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const key = `${subdir}/${filename}`;

  if (token) {
    const { put } = await import('@vercel/blob');
    const blob = await put(key, buffer, {
      access: 'public',
      token,
      contentType,
      addRandomSuffix: false,
    });
    return { url: blob.url };
  }

  // Local-disk fallback for development.
  const dir = join(process.cwd(), 'public', 'uploads', subdir);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buffer);
  return { url: `/uploads/${subdir}/${filename}` };
}

/** Best-effort delete for a previously stored upload (Blob when configured). */
export async function deleteUpload(url: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token && /^https?:\/\//.test(url)) {
    try {
      const { del } = await import('@vercel/blob');
      await del(url, { token });
    } catch {
      /* ignore */
    }
  }
  // Local files are left in place (dev only); not worth unlinking best-effort.
}
