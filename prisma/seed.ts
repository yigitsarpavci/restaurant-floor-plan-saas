import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Restaurant',
      slug: 'demo',
      reservationMode: 'TIMED',
    },
  });

  const floorPlan = await prisma.floorPlan.create({
    data: {
      name: 'Main Floor',
      tenantId: tenant.id,
      tables: {
        create: [
          { name: 'T1', x: 50, y: 50, width: 60, height: 60, capacity: 2, shape: 'CIRCLE' },
          { name: 'T2', x: 150, y: 50, width: 60, height: 60, capacity: 2, shape: 'CIRCLE' },
          { name: 'T3', x: 50, y: 150, width: 80, height: 80, capacity: 4, shape: 'RECTANGLE' },
        ],
      },
    },
  });

  console.log({ tenant, floorPlan });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
