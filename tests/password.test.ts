import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  generateTemporaryPassword,
  hashPassword,
  verifyAdminPassword,
  verifyPassword,
} from '../lib/password';

afterEach(() => vi.unstubAllEnvs());

describe('verifyPassword', () => {
  it('accepts a correct bcrypt password and rejects a wrong one', async () => {
    const hash = await hashPassword('s3cret!');
    expect(hash.startsWith('$2')).toBe(true);
    expect(await verifyPassword('s3cret!', hash)).toEqual({ ok: true, needsRehash: false });
    expect((await verifyPassword('wrong', hash)).ok).toBe(false);
  });

  it('accepts a legacy plaintext password once and asks for a rehash', async () => {
    expect(await verifyPassword('ABC123', 'ABC123')).toEqual({ ok: true, needsRehash: true });
    expect(await verifyPassword('nope', 'ABC123')).toEqual({ ok: false, needsRehash: false });
  });

  it('rejects when no password is stored', async () => {
    expect((await verifyPassword('anything', null)).ok).toBe(false);
  });
});

describe('verifyAdminPassword', () => {
  it('uses ADMIN_PASSWORD when set', () => {
    vi.stubEnv('ADMIN_PASSWORD', 'hunter2');
    expect(verifyAdminPassword('hunter2')).toBe(true);
    expect(verifyAdminPassword('admin')).toBe(false);
    expect(verifyAdminPassword(undefined)).toBe(false);
  });

  it('is disabled in production when ADMIN_PASSWORD is missing', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_PASSWORD', '');
    delete process.env.ADMIN_PASSWORD;
    expect(verifyAdminPassword('admin')).toBe(false);
  });
});

describe('generateTemporaryPassword', () => {
  it('returns an 8-character alphanumeric password', () => {
    const pw = generateTemporaryPassword();
    expect(pw).toMatch(/^[A-Z0-9]{8}$/);
    expect(generateTemporaryPassword()).not.toBe(pw);
  });
});
