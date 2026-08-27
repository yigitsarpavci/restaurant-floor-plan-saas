'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { approveReservation, rejectReservation } from '@/app/actions/live-ops';
import { PendingReservation } from './LiveOpsDashboard';

export default function PendingQueue({ reservations }: { reservations: PendingReservation[] }) {
  const router = useRouter();

  const handleApprove = async (id: string) => {
    await approveReservation(id);
    router.refresh();
  };

  const handleReject = async (id: string) => {
    await rejectReservation(id);
    router.refresh();
  };

  return (
    <div className="w-full h-full flex flex-col z-10">
      <div className="p-0 border-b border-gray-100 dark:border-gray-800 bg-transparent mb-2">
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{reservations.length} requests waiting</p>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4">
        {reservations.map(res => (
          <div key={res.id} className="bg-white dark:bg-gray-800 border border-yellow-200/60 dark:border-yellow-700/60 shadow-sm hover:shadow-md transition-shadow rounded-xl p-4 relative overflow-hidden">
            {/* Visual indicator line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 dark:bg-yellow-600"></div>
            
            <h3 className="font-semibold text-gray-900 dark:text-white">{res.customerName}</h3>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 space-y-0.5">
              <p className="flex items-center gap-1.5">
                <span className="font-medium text-gray-700 dark:text-gray-300">Time:</span> {res.time}
              </p>
              <p className="flex items-center gap-1.5">
                <span className="font-medium text-gray-700 dark:text-gray-300">Tables:</span> {res.tables.join(', ')}
              </p>
            </div>
            
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button 
                onClick={() => handleReject(res.id)}
                className="flex-1 py-2 px-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg text-sm font-medium transition-colors"
              >
                Reject
              </button>
              <button 
                onClick={() => handleApprove(res.id)}
                className="flex-1 py-2 px-3 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        ))}
        {reservations.length === 0 && (
          <div className="text-center text-gray-400 dark:text-gray-500 mt-12 text-sm flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <span className="text-gray-300 dark:text-gray-600 text-2xl">✓</span>
            </div>
            All caught up!
          </div>
        )}
      </div>
    </div>
  );
}
