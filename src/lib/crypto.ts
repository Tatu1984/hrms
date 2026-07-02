import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

/**
 * Symmetric encryption for secrets stored at rest (e.g. integration access
 * tokens / PATs). AES-256-GCM (authenticated). Values are self-describing:
 *   enc:v1:<ivHex>:<authTagHex>:<cipherHex>
 *
 * Backward compatible: decryptSecret() returns any value without the `enc:v1:`
 * prefix unchanged, so previously-stored plaintext tokens keep working and get
 * re-encrypted the next time they're written.
 */
const PREFIX = 'enc:v1:';

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('ENCRYPTION_KEY is not set — cannot encrypt/decrypt secrets.');
  }
  // A 64-char hex string is used directly as 32 raw bytes; anything else is
  // stretched to 32 bytes so an arbitrary passphrase still works.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  return scryptSync(raw, 'hrms-secret-at-rest', 32);
}

export function isEncrypted(value: string | null | undefined): boolean {
  return !!value && value.startsWith(PREFIX);
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decryptSecret(value: string | null | undefined): string {
  if (!value) return '';
  if (!value.startsWith(PREFIX)) return value; // legacy plaintext — return as-is
  const [ivHex, tagHex, dataHex] = value.slice(PREFIX.length).split(':');
  if (!ivHex || !tagHex || !dataHex) return value;
  try {
    const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]);
    return dec.toString('utf8');
  } catch {
    // Wrong key / corrupt payload — return raw so callers fail loudly downstream
    // rather than us throwing here.
    return value;
  }
}
