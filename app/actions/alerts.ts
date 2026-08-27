'use server';

import prisma from '@/lib/prisma';
import { ReservationStatus, ReservationMode } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export interface DashboardAlert {
  id: string;
  type: 'NO_SHOW' | 'OVERSTAY';
  message: string;
  reservationId: string;
  tableNames: string;
}

export async function fetchLiveAlerts(tenantId: string) {
  const now = new Date();
  const alerts: DashboardAlert[] = [];

  // 1. Check for No-Shows (15 mins past start time, still CONFIRMED)
  const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
  
  const lateReservations = await prisma.reservation.findMany({
    where: {
      tenantId,
      status: ReservationStatus.CONFIRMED,
      startTime: { lte: fifteenMinsAgo },
    },
    include: {
      tables: { include: { table: true } }
    }
  });

  for (const res of lateReservations) {
    const tableNames = res.tables.map(t => t.table.name).join(', ');
    alerts.push({
      id: `noshow-${res.id}`,
      type: 'NO_SHOW',
      reservationId: res.id,
      message: `Customer ${res.customerName} is 15 mins late. ${res.phoneNumber}`,
      tableNames
    });
  }

  // 2. Check for Overstays (Seated for > 2 hours in TIMED mode)
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  
  const overstayReservations = await prisma.reservation.findMany({
    where: {
      tenantId,
      status: ReservationStatus.SEATED,
      startTime: { lte: twoHoursAgo },
      tenant: {
        reservationMode: ReservationMode.TIMED
      }
    },
    include: {
      tables: { include: { table: true } }
    }
  });

  for (const res of overstayReservations) {
    const tableNames = res.tables.map(t => t.table.name).join(', ');
    alerts.push({
      id: `overstay-${res.id}`,
      type: 'OVERSTAY',
      reservationId: res.id,
      message: `Table ${tableNames} has been seated for 2+ hours. Did they leave?`,
      tableNames
    });
  }

  return alerts;
}

export async function markNoShow(reservationId: string) {
  // Marking NO_SHOW instantly frees up the table since it's no longer CONFIRMED/SEATED
  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: ReservationStatus.NO_SHOW },
  });
  revalidatePath('/liveops');
  return { success: true };
}

export async function keepHolding(reservationId: string) {
  // Logic to snooze or track that staff approved a grace period extension.
  return { success: true };
}

export async function markCleared(reservationId: string) {
  // Instantly unlocks the table allowing concurrent walk-ins or pending approvals
  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: ReservationStatus.CLEARED },
  });
  revalidatePath('/liveops');
  return { success: true };
}
