'use server';

import prisma from '@/lib/prisma';
import { bookingSchema, BookingFormData } from '@/lib/validations/booking';
import { ReservationStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function submitReservation(data: BookingFormData) {
  // Validate data with Zod
  const parsedData = bookingSchema.safeParse(data);
  if (!parsedData.success) {
    const errorMsg = parsedData.error.issues.map(i => i.message).join(', ');
    throw new Error(errorMsg);
  }

  const { customerName, phoneNumber, email, date, time, endTime: providedEndTime, tableIds, tenantId } = parsedData.data;

  const startTime = new Date(`${date}T${time}:00`);
  
  // If endTime is provided (Partly Available), use it. Otherwise, assume they stay until the end of the day.
  const endTime = providedEndTime ? new Date(providedEndTime) : new Date(`${date}T23:59:59`);

  // 1. Check if the table is still available (concurrent booking prevention)
  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59`);

  const existingLock = await prisma.reservationTable.findFirst({
    where: {
      tableId: { in: tableIds },
      reservation: {
        status: { in: ['PENDING_APPROVAL', 'CONFIRMED', 'SEATED', 'WALK_IN'] },
        // If there's any active reservation that starts before or exactly at our startTime, it's blocked.
        startTime: { lte: startTime, gte: startOfDay }
      }
    }
  });

  if (existingLock) {
    throw new Error('One or more selected tables are no longer available for this time. Please select another table.');
  }

  // 2. Create the reservation with PENDING_APPROVAL and soft lock the tables
  await prisma.reservation.create({
    data: {
      tenantId,
      status: ReservationStatus.PENDING_APPROVAL,
      customerName,
      phoneNumber,
      email,
      startTime,
      endTime,
      tables: {
        create: tableIds.map(id => ({
          table: { connect: { id } }
        }))
      }
    }
  });

  revalidatePath('/', 'layout');
  revalidatePath('/liveops');

  return { 
    success: true, 
    message: "Your request is sent to the restaurant for approval. You will be notified shortly." 
  };
}

export async function checkAvailability(tenantId: string, date: string, time: string) {
  const requestedStartTime = new Date(`${date}T${time}:00`);
  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59`);

  // Fetch all active reservations for the day
  const activeReservations = await prisma.reservation.findMany({
    where: {
      tenantId,
      status: { in: ['PENDING_APPROVAL', 'CONFIRMED', 'SEATED', 'WALK_IN'] },
      startTime: { gte: startOfDay, lte: endOfDay },
    },
    include: { tables: true }
  });

  const availabilityMap: Record<string, { status: 'BOOKED' | 'PARTLY_AVAILABLE', availableUntil?: Date }> = {};

  for (const res of activeReservations) {
    for (const t of res.tables) {
      const existing = availabilityMap[t.tableId];
      
      // If the reservation starts before or at the requested startTime, the table is completely BOOKED.
      // (Because we don't have a fixed duration, we assume they might stay forever until cleared)
      if (res.startTime <= requestedStartTime) {
        availabilityMap[t.tableId] = { status: 'BOOKED' };
      } 
      // If the reservation starts AFTER the requested startTime, it is PARTLY_AVAILABLE
      else if (res.startTime > requestedStartTime) {
        // Only set partly available if it's not already BOOKED
        if (!existing || existing.status !== 'BOOKED') {
           // Take the earliest future reservation
           if (!existing || !existing.availableUntil || res.startTime < existing.availableUntil) {
              availabilityMap[t.tableId] = { status: 'PARTLY_AVAILABLE', availableUntil: res.startTime };
           }
        }
      }
    }
  }

  // Convert map for client side (Date to string)
  const result: Record<string, { status: 'BOOKED' | 'PARTLY_AVAILABLE', availableUntil?: string }> = {};
  for (const [tableId, data] of Object.entries(availabilityMap)) {
    result[tableId] = {
      status: data.status,
      availableUntil: data.availableUntil ? data.availableUntil.toISOString() : undefined
    };
  }

  return result;
}
