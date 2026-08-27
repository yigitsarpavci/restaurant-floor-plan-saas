import FloorPlanBuilder from '@/components/floor-plan/FloorPlanBuilder';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface BuilderPageProps {
  params: {
    tenantSlug: string;
  };
}

export default async function BuilderPage({ params }: BuilderPageProps) {
  const resolvedParams = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug: resolvedParams.tenantSlug }
  });

  if (!tenant) return notFound();

  const floorPlan = await prisma.floorPlan.findFirst({
    where: { tenantId: tenant.id },
    include: { tables: { where: { isDeleted: false } } }
  });

  if (!floorPlan) return <div>No floor plan found for this tenant.</div>;

  const initialTables = floorPlan.tables.map(t => ({
    id: t.id,
    name: t.name,
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    capacity: t.capacity,
    shape: t.shape as 'RECTANGLE' | 'CIRCLE' | 'SQUARE' | 'BOOTH',
  }));

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4 text-sm font-medium">
        <Link href={`/manage/${tenant.slug}`} className="text-gray-500 hover:text-black">
          &larr; Back to {tenant.name}
        </Link>
      </div>
      <div className="flex-1">
        <FloorPlanBuilder floorPlanId={floorPlan.id} initialTables={initialTables} />
      </div>
    </div>
  );
}
