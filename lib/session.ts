import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  role: 'admin' | 'owner';
  /** Only set for restaurant owners. */
  tenantId?: string;
};

function getKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set in production.');
    }
    // Local development only. Never used when NODE_ENV === 'production'.
    return new TextEncoder().encode('dev-only-insecure-session-secret');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ['HS256'] });
    if (payload.role !== 'admin' && payload.role !== 'owner') return null;
    if (payload.role === 'owner' && typeof payload.tenantId !== 'string') return null;
    return { role: payload.role, tenantId: payload.tenantId as string | undefined };
  } catch {
    return null;
  }
}
