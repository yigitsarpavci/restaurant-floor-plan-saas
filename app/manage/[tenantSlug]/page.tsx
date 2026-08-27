import React from 'react';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminPasswordReset from '@/components/manage/AdminPasswordReset';
import TenantHeaderActions from '@/components/manage/TenantHeaderActions';
import { ThemeToggle } from '@/components/ThemeToggle';

export const dynamic = 'force-dynamic';

interface TenantManageProps {
  params: {
    tenantSlug: string;
  };
}

export default async function TenantManagePage({ params }: TenantManageProps) {
  const resolvedParams = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug: resolvedParams.tenantSlug },
    include: {
      floorPlans: true,
      reservations: true,
    }
  });

  if (!tenant) return notFound();

  const floorPlan = tenant.floorPlans[0]; // Assuming 1 floor plan per tenant for now

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-200">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/manage" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              &larr; Back
            </Link>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{tenant.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <TenantHeaderActions tenant={tenant} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Restaurant Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Public Booking Link</label>
                <div className="flex">
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-l-lg px-4 py-3 text-gray-700 dark:text-gray-300 font-mono text-sm break-all">
                    seated.com/booking/{tenant.slug}
                  </div>
                  <div className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-r-lg font-medium text-sm flex items-center cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                    Copy
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Share this link with your customers on Instagram, WhatsApp, or your website.</p>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Login Credentials</h3>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-xl">
                  <p className="text-sm text-green-800 dark:text-green-300 mb-4">Share these credentials with the restaurant owner so they can log in to their LiveOps dashboard.</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-green-900 dark:text-green-400 uppercase tracking-wider mb-1">Username</label>
                      <div className="bg-white dark:bg-gray-800 px-4 py-2.5 rounded-lg border border-green-200 dark:border-green-800 font-mono text-sm dark:text-gray-300">{tenant.slug}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-900 dark:text-green-400 uppercase tracking-wider mb-1">Password</label>
                      <AdminPasswordReset tenantId={tenant.id} currentPassword={tenant.password || ''} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Floor Plan</h3>
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{floorPlan ? floorPlan.name : 'No Floor Plan'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Design your table layout to accept reservations.</p>
                  </div>
                  <Link 
                    href={`/manage/${tenant.slug}/floorplan`}
                    className="bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                  >
                    Edit Floor Plan
                  </Link>
                </div>
              </div>
              


            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
