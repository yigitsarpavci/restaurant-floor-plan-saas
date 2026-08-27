'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CreateTenantDialog from './CreateTenantDialog';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  activeReservations: number;
  hasFloorPlan: boolean;
}

export default function TenantList({ initialTenants }: { initialTenants: TenantInfo[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsDialogOpen(true)}
          className="bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
        >
          Add Restaurant
        </button>
      </div>

      {initialTenants.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No restaurants yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">Get started by creating your first restaurant. You'll be able to design a floor plan and start taking reservations immediately.</p>
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Create Restaurant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialTenants.map(tenant => (
            <Link 
              key={tenant.id} 
              href={`/manage/${tenant.slug}`}
              className="block group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-black dark:group-hover:text-white">{tenant.name}</h3>
                  {tenant.activeReservations > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      {tenant.activeReservations} active
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    <span className="truncate">seated.com/booking/{tenant.slug}</span>
                  </div>
                </div>

                <div className="flex items-center text-sm font-medium text-black dark:text-white group-hover:underline">
                  Manage Restaurant &rarr;
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateTenantDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </div>
  );
}
