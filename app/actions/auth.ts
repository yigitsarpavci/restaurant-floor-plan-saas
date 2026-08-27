'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export async function login(username: string, password?: string) {
  const cookieStore = await cookies();

  if (username === 'admin') {
    cookieStore.set('role', 'admin', { path: '/' });
    redirect('/manage');
  }

  // Look up tenant by slug (username)
  const tenant = await prisma.tenant.findUnique({
    where: { slug: username }
  });

  if (!tenant) {
    throw new Error('Restaurant not found');
  }

  // Validate password
  if (tenant.password !== password) {
    throw new Error('Incorrect password');
  }

  cookieStore.set('role', 'owner', { path: '/' });
  cookieStore.set('tenantId', tenant.id, { path: '/' });
  
  redirect('/liveops');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('role');
  cookieStore.delete('tenantId');
  redirect('/');
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('tenantId')?.value;

  if (!tenantId) {
    throw new Error('Not authenticated');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  if (tenant.password !== oldPassword) {
    throw new Error('Incorrect current password');
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { password: newPassword }
  });

  return { success: true };
}
