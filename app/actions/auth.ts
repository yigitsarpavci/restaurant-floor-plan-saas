'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { requireSession } from '@/lib/authz';
import {
  MIN_PASSWORD_LENGTH,
  hashPassword,
  verifyAdminPassword,
  verifyPassword,
} from '@/lib/password';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, SessionPayload, signSession } from '@/lib/session';

async function startSession(payload: SessionPayload) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await signSession(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

// Returns an error value instead of throwing: production builds replace thrown server-action
// messages with a generic digest, so a thrown "Invalid username or password" never reaches the UI.
export async function login(username: string, password?: string): Promise<{ error: string } | void> {
  const invalid = { error: 'Invalid username or password' };

  if (username === 'admin') {
    if (!verifyAdminPassword(password)) return invalid;
    await startSession({ role: 'admin' });
    redirect('/manage');
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug: username } });
  if (!tenant) return invalid;

  const { ok, needsRehash } = await verifyPassword(password ?? '', tenant.password);
  if (!ok) return invalid;

  if (needsRehash) {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { password: await hashPassword(password as string) },
    });
  }

  await startSession({ role: 'owner', tenantId: tenant.id });
  redirect('/liveops');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect('/');
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const session = await requireSession();
  if (session.role !== 'owner' || !session.tenantId) {
    throw new Error('Only restaurant owners can change their password here');
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } });
  if (!tenant) throw new Error('Tenant not found');

  const { ok } = await verifyPassword(oldPassword, tenant.password);
  if (!ok) throw new Error('Incorrect current password');

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { password: await hashPassword(newPassword) },
  });

  return { success: true };
}
