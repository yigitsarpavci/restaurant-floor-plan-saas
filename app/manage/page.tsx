import React from 'react';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { logout } from '@/app/actions/auth';
import TenantList from '@/components/manage/TenantList';
import { ThemeToggle } from '@/components/ThemeToggle';

export const dynamic = 'force-dynamic';

export default async function ManageDashboard() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      floorPlans: true,
      reservations: {
        where: {
          status: { in: ['CONFIRMED', 'SEATED', 'WALK_IN'] }
        }
      }
    }
  });

  const formattedTenants = tenants.map(t => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    activeReservations: t.reservations.length,
    hasFloorPlan: t.floorPlans.length > 0
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-200">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Seated Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <form action={logout}>
              <button type="submit" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Restaurants</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your restaurant tenants and their floor plans.</p>
        </div>

        <TenantList initialTenants={formattedTenants} />
      </main>
    </div>
  );
}
