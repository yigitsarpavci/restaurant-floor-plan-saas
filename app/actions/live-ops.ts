'use server';

import prisma from '@/lib/prisma';
import { ReservationStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function approveReservation(reservationId: string) {
  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: ReservationStatus.CONFIRMED },
  });
  revalidatePath('/liveops');
  return { success: true };
}

export async function rejectReservation(reservationId: string) {
  // Free up the tables by deleting the rejected request (or you could use a CANCELED status if added to schema)
  await prisma.reservation.delete({
    where: { id: reservationId },
  });
  revalidatePath('/liveops');
  return { success: true };
}

export async function createWalkIn(tenantId: string, tableIds: string[]) {
  // Walk-ins occupy the tables immediately.
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hr block

  const reservation = await prisma.reservation.create({
    data: {
      tenantId,
      status: ReservationStatus.WALK_IN,
      customerName: 'Walk-in Guest',
      phoneNumber: 'N/A',
      email: 'N/A',
      startTime,
      endTime,
      tables: {
        create: tableIds.map(id => ({
          table: { connect: { id } }
        }))
      }
    }
  });
  
  revalidatePath('/liveops');
  return { success: true, reservationId: reservation.id };
}

export async function updateReservationStatus(reservationId: string, status: ReservationStatus) {
  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status },
  });
  revalidatePath('/liveops');
  return { success: true };
}
