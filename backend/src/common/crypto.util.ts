import * as crypto from 'crypto';

// AES-256-GCM encryption for storing social OAuth tokens at rest.
// Key is derived from ENCRYPTION_KEY env (must be 32 bytes / 64 hex chars).

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;

function getKey(): Buffer {
  const raw = process.env.CREDENTIAL_ENCRYPTION_KEY || '';
  if (raw.length === 64) {
    return Buffer.from(raw, 'hex');
  }
  // Fallback: derive a 32-byte key from whatever is provided (dev only)
  return crypto.createHash('sha256').update(raw || 'dev-insecure-key').digest();
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decrypt(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    'utf8',
  );
}
