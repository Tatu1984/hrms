import { randomBytes, createHash } from 'node:crypto';
import { prisma } from '@/lib/db';

/**
 * Password-reset token lifecycle.
 *
 * The RAW token is a 32-byte hex string handed to the user (in the reset link);
 * only its SHA-256 hash is ever stored, so a leaked DB row can't be used to
 * reset a password. Tokens expire after 1 hour and are single-use.
 */
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Create a fresh reset token for a user, returning the RAW token. Any prior
 * unused tokens for the user are deleted first so only the newest link works.
 */
export async function createResetToken(userId: string): Promise<string> {
  await prisma.passwordResetToken.deleteMany({
    where: { userId, usedAt: null },
  });

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  return rawToken;
}

/**
 * Validate and consume a raw reset token. Returns the owning userId on success
 * (marking the token used), or null if the token is unknown, already used, or
 * expired.
 */
export async function consumeResetToken(
  rawToken: string,
): Promise<{ userId: string } | null> {
  if (!rawToken) return null;

  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt.getTime() < Date.now()) return null;

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return { userId: record.userId };
}
