import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { SESSION_COOKIE, SessionPayload, verifySession } from '@/lib/session';

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== 'admin') throw new Error('Forbidden');
  return session;
}

/** Admins may act on any tenant, owners only on their own. */
export async function requireTenantAccess(tenantId: string): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role === 'admin') return session;
  if (session.tenantId !== tenantId) throw new Error('Forbidden');
  return session;
}

export async function requireReservationAccess(reservationId: string): Promise<SessionPayload> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: { tenantId: true },
  });
  if (!reservation) throw new Error('Reservation not found');
  return requireTenantAccess(reservation.tenantId);
}

export async function requireFloorPlanAccess(floorPlanId: string): Promise<SessionPayload> {
  const floorPlan = await prisma.floorPlan.findUnique({
    where: { id: floorPlanId },
    select: { tenantId: true },
  });
  if (!floorPlan) throw new Error('Floor plan not found');
  return requireTenantAccess(floorPlan.tenantId);
}
