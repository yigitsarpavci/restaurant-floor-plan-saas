import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const minutes = (m: number) => new Date(Date.now() + m * 60_000);

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Restaurant',
      slug: 'demo',
      reservationMode: 'TIMED',
      password: await bcrypt.hash(process.env.SEED_DEMO_PASSWORD ?? 'demo1234', 10),
    },
  });

  // Idempotent: only build the floor plan and sample reservations once.
  const existing = await prisma.floorPlan.findFirst({ where: { tenantId: tenant.id } });
  if (existing) {
    console.log(`Demo restaurant "${tenant.slug}" already seeded.`);
    return;
  }

  const floorPlan = await prisma.floorPlan.create({
    data: {
      name: 'Main Floor',
      tenantId: tenant.id,
      tables: {
        create: [
          { name: 'T1', x: 60, y: 60, width: 70, height: 70, capacity: 2, shape: 'CIRCLE' },
          { name: 'T2', x: 170, y: 60, width: 70, height: 70, capacity: 2, shape: 'CIRCLE' },
          { name: 'T3', x: 280, y: 60, width: 70, height: 70, capacity: 2, shape: 'CIRCLE' },
          { name: 'T4', x: 60, y: 180, width: 110, height: 80, capacity: 4, shape: 'RECTANGLE' },
          { name: 'T5', x: 220, y: 180, width: 110, height: 80, capacity: 4, shape: 'RECTANGLE' },
          { name: 'T6', x: 380, y: 180, width: 90, height: 90, capacity: 4, shape: 'SQUARE' },
          { name: 'B1', x: 60, y: 320, width: 200, height: 70, capacity: 6, shape: 'BOOTH' },
          { name: 'B2', x: 300, y: 320, width: 200, height: 70, capacity: 6, shape: 'BOOTH' },
        ],
      },
    },
    include: { tables: true },
  });

  const byName = Object.fromEntries(floorPlan.tables.map((t) => [t.name, t.id]));
  const samples = [
    { customerName: 'Elif Yılmaz', phoneNumber: '5551112233', email: 'elif@example.com', status: 'CONFIRMED' as const, start: 45, tables: ['T4'] },
    { customerName: 'Can Demir', phoneNumber: '5552223344', email: 'can@example.com', status: 'PENDING_APPROVAL' as const, start: 90, tables: ['T1'] },
    { customerName: 'Zeynep Kaya', phoneNumber: '5553334455', email: 'zeynep@example.com', status: 'SEATED' as const, start: -30, tables: ['B1'] },
    { customerName: 'Mert Aydın', phoneNumber: '5554445566', email: 'mert@example.com', status: 'CONFIRMED' as const, start: 120, tables: ['T5', 'T6'] },
  ];
  for (const s of samples) {
    await prisma.reservation.create({
      data: {
        tenantId: tenant.id,
        status: s.status,
        customerName: s.customerName,
        phoneNumber: s.phoneNumber,
        email: s.email,
        startTime: minutes(s.start),
        endTime: minutes(s.start + 90),
        tables: { create: s.tables.map((n) => ({ tableId: byName[n] })) },
      },
    });
  }

  console.log(`Seeded "${tenant.slug}" with ${floorPlan.tables.length} tables and ${samples.length} reservations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
