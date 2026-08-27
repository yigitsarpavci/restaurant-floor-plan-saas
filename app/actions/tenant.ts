'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createTenant(data: { name: string; slug: string }) {
  try {
    const password = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 1. Create the tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        reservationMode: 'UNTIMED',
        password: password,
      },
    });

    // 2. Create an empty floor plan for the new tenant
    await prisma.floorPlan.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Floor',
      },
    });

    revalidatePath('/manage');
    return { success: true, tenantSlug: tenant.slug, password: password };
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    if (error.code === 'P2002') {
      return { success: false, error: 'A restaurant with this URL slug already exists.' };
    }
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

export async function adminUpdatePassword(tenantId: string, newPassword: string) {
  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { password: newPassword }
    });
    revalidatePath('/manage');
    revalidatePath(`/manage/[tenantSlug]`, 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating password:', error);
    return { success: false, error: 'Failed to update password.' };
  }
}

export async function updateTenant(tenantId: string, data: { name: string; slug: string }) {
  try {
    const existing = await prisma.tenant.findUnique({
      where: { slug: data.slug }
    });

    if (existing && existing.id !== tenantId) {
      return { success: false, error: 'A restaurant with this URL slug already exists.' };
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { name: data.name, slug: data.slug }
    });
    
    revalidatePath('/manage');
    revalidatePath(`/manage/[tenantSlug]`, 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating tenant:', error);
    return { success: false, error: 'Failed to update restaurant.' };
  }
}

export async function deleteTenant(tenantId: string) {
  try {
    const floorPlans = await prisma.floorPlan.findMany({ where: { tenantId }, select: { id: true } });
    const floorPlanIds = floorPlans.map(f => f.id);
    const reservations = await prisma.reservation.findMany({ where: { tenantId }, select: { id: true } });
    const reservationIds = reservations.map(r => r.id);

    // Delete join table records
    if (reservationIds.length > 0) {
      await prisma.reservationTable.deleteMany({
        where: { reservationId: { in: reservationIds } }
      });
    }

    // Delete Tables
    if (floorPlanIds.length > 0) {
      await prisma.table.deleteMany({
        where: { floorPlanId: { in: floorPlanIds } }
      });
    }

    // Delete FloorPlans
    await prisma.floorPlan.deleteMany({ where: { tenantId } });

    // Delete Reservations
    await prisma.reservation.deleteMany({ where: { tenantId } });

    // Delete Tenant
    await prisma.tenant.delete({ where: { id: tenantId } });

    revalidatePath('/manage');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting tenant:', error);
    return { success: false, error: 'Failed to delete restaurant.' };
  }
}
