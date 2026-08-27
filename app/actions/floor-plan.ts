'use server';

import prisma from '@/lib/prisma';
import { TableShape } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function saveFloorPlanLayout(
  floorPlanId: string, 
  tables: {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    capacity: number;
    shape: string;
  }[]
) {
  // In a real app, verify tenant authentication and permissions here.
  
  const incomingTableIds = tables.map(t => t.id);

  await prisma.$transaction(async (tx) => {
    // 1. Soft-delete tables that were removed from the canvas
    await tx.table.updateMany({
      where: {
        floorPlanId,
        id: { notIn: incomingTableIds },
        isDeleted: false
      },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    // 2. Upsert incoming tables
    for (const table of tables) {
      const exists = await tx.table.findUnique({ where: { id: table.id } });

      if (exists) {
        await tx.table.update({
          where: { id: table.id },
          data: {
            name: table.name,
            x: table.x,
            y: table.y,
            width: table.width,
            height: table.height,
            capacity: table.capacity,
            shape: table.shape as TableShape,
            isDeleted: false, // restore if it was previously soft-deleted
            deletedAt: null
          }
        });
      } else {
        await tx.table.create({
          data: {
            id: table.id, 
            floorPlanId,
            name: table.name,
            x: table.x,
            y: table.y,
            width: table.width,
            height: table.height,
            capacity: table.capacity,
            shape: table.shape as TableShape
          }
        });
      }
    }
  });

  revalidatePath('/', 'layout');
  revalidatePath('/liveops');
  revalidatePath('/manage');

  return { success: true };
}
