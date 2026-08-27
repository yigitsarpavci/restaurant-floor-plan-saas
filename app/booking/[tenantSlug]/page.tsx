import BookingFlow from '@/components/booking/BookingFlow';
import prisma from '@/lib/prisma';
import { PublicTable } from '@/components/booking/CustomerFloorPlan';
import { notFound } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

export const dynamic = 'force-dynamic';

interface BookingPageProps {
  params: {
    tenantSlug: string;
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const resolvedParams = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug: resolvedParams.tenantSlug } });
  const floorPlan = await prisma.floorPlan.findFirst({
    where: { tenantId: tenant?.id },
    include: { tables: { where: { isDeleted: false } } }
  });

  if (!tenant || !floorPlan) return <div>No data found. Run seed script.</div>;

  const publicTables: PublicTable[] = floorPlan.tables.map(t => ({
    id: t.id,
    name: t.name,
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    capacity: t.capacity,
    shape: t.shape as PublicTable['shape'],
    status: 'AVAILABLE' // Will be dynamically set by checkAvailability on search
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <BookingFlow tenantId={tenant.id} initialTables={publicTables} />
    </div>
  );
}
