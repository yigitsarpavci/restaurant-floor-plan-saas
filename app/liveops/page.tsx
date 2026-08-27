import LiveOpsDashboard from '@/components/live-ops/LiveOpsDashboard';
import prisma from '@/lib/prisma';
import { LiveTable } from '@/components/live-ops/LiveFloorPlan';
import { PendingReservation } from '@/components/live-ops/LiveOpsDashboard';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LiveOpsPage() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('tenantId')?.value;

  if (!tenantId) {
    redirect('/');
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const floorPlan = await prisma.floorPlan.findFirst({
    where: { tenantId: tenant?.id },
    include: { tables: { where: { isDeleted: false } } }
  });

  if (!tenant || !floorPlan) return <div>No data found or floor plan missing. Please contact admin.</div>;

  // Find active reservations right now to determine table status
  const now = new Date();
  const activeReservations = await prisma.reservation.findMany({
    where: {
      tenantId: tenant.id,
      status: { in: ['CONFIRMED', 'SEATED', 'WALK_IN'] },
      startTime: { lte: now },
      endTime: { gt: now }
    },
    include: { tables: true }
  });

  // Build a map of tableId -> status and activeReservationId
  const tableStatusMap: Record<string, LiveTable['status']> = {};
  const activeReservationMap: Record<string, string> = {};
  for (const res of activeReservations) {
    const tableStatus = res.status === 'WALK_IN' ? 'SEATED' : res.status;
    for (const t of res.tables) {
      tableStatusMap[t.tableId] = tableStatus as LiveTable['status'];
      activeReservationMap[t.tableId] = res.id;
    }
  }

  // Find upcoming reservations for today to show "Empty till X"
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const upcomingReservations = await prisma.reservation.findMany({
    where: {
      tenantId: tenant.id,
      status: { in: ['CONFIRMED', 'PENDING_APPROVAL'] },
      startTime: { gt: now, lte: endOfDay }
    },
    orderBy: { startTime: 'asc' },
    include: { tables: true }
  });

  const nextReservationMap: Record<string, string> = {};
  for (const res of upcomingReservations) {
    const timeStr = new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    for (const t of res.tables) {
      if (!nextReservationMap[t.tableId]) {
        nextReservationMap[t.tableId] = timeStr; // Only save the first (earliest) one
      }
    }
  }

  const liveTables: LiveTable[] = floorPlan.tables.map(t => ({
    id: t.id,
    name: t.name,
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    capacity: t.capacity,
    shape: t.shape as LiveTable['shape'],
    status: tableStatusMap[t.id] || 'AVAILABLE',
    activeReservationId: activeReservationMap[t.id] || undefined,
    nextReservationTime: nextReservationMap[t.id] || undefined
  }));

  const dbPending = await prisma.reservation.findMany({
    where: { tenantId: tenant.id, status: 'PENDING_APPROVAL' },
    include: { tables: { include: { table: true } } }
  });

  const pending: PendingReservation[] = dbPending.map(res => ({
    id: res.id,
    customerName: res.customerName,
    guestCount: res.tables.reduce((acc, t) => acc + t.table.capacity, 0),
    time: new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tables: res.tables.map(t => t.table.name)
  }));

  return (
    <LiveOpsDashboard 
      tenantId={tenant.id} 
      tenant={tenant}
      tables={liveTables} 
      pendingReservations={pending} 
    />
  );
}
