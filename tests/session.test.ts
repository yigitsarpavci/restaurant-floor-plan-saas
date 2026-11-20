import { SignJWT } from 'jose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signSession, verifySession } from '../lib/session';

beforeEach(() => vi.stubEnv('SESSION_SECRET', 'test-secret'));
afterEach(() => vi.unstubAllEnvs());

describe('session cookie', () => {
  it('round-trips an owner session', async () => {
    const token = await signSession({ role: 'owner', tenantId: 't1' });
    expect(await verifySession(token)).toEqual({ role: 'owner', tenantId: 't1' });
  });

  it('rejects a tampered or foreign token', async () => {
    const token = await signSession({ role: 'admin' });
    expect(await verifySession(token.slice(0, -2) + 'xx')).toBeNull();
    const forged = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(new TextEncoder().encode('another-secret'));
    expect(await verifySession(forged)).toBeNull();
  });

  it('rejects owner tokens without a tenant and missing tokens', async () => {
    const token = await signSession({ role: 'owner' });
    expect(await verifySession(token)).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  });

  it('refuses to run without a secret in production', async () => {
    vi.stubEnv('SESSION_SECRET', '');
    vi.stubEnv('NODE_ENV', 'production');
    await expect(signSession({ role: 'admin' })).rejects.toThrow(/SESSION_SECRET/);
  });
});
