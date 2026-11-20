import bcrypt from 'bcryptjs';
import { randomBytes, timingSafeEqual } from 'crypto';

const BCRYPT_ROUNDS = 10;

export const MIN_PASSWORD_LENGTH = 6;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

/** Constant-time string comparison (pads to equal length; no hashing of the secret involved). */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  const len = Math.max(bufA.length, bufB.length, 1);
  const padA = Buffer.alloc(len);
  const padB = Buffer.alloc(len);
  bufA.copy(padA);
  bufB.copy(padB);
  return timingSafeEqual(padA, padB) && bufA.length === bufB.length;
}

/**
 * Verifies a password against a stored value.
 * Legacy rows that still hold a plaintext password are accepted once and flagged
 * with `needsRehash` so the caller can upgrade them to bcrypt transparently.
 */
export async function verifyPassword(
  plain: string,
  stored: string | null | undefined
): Promise<{ ok: boolean; needsRehash: boolean }> {
  if (!stored) return { ok: false, needsRehash: false };
  if (isBcryptHash(stored)) {
    return { ok: await bcrypt.compare(plain, stored), needsRehash: false };
  }
  const ok = safeEqual(plain, stored);
  return { ok, needsRehash: ok };
}

/** Constant-time comparison for the admin password read from the environment. */
export function verifyAdminPassword(plain: string | undefined): boolean {
  const expected =
    process.env.ADMIN_PASSWORD ?? (process.env.NODE_ENV === 'production' ? undefined : 'admin');
  if (!expected || !plain) return false;
  return safeEqual(plain, expected);
}

/** Random one-time password shown once to the admin when a tenant is created. */
export function generateTemporaryPassword(): string {
  return randomBytes(6).toString('base64url').replace(/[-_]/g, 'x').slice(0, 8).toUpperCase();
}
