'use client';

import React, { useState, useEffect } from 'react';
import PendingQueue from './PendingQueue';
import LiveFloorPlan, { LiveTable } from './LiveFloorPlan';
import WalkInBar from './WalkInBar';
import AlertsPanel from './AlertsPanel';
import { logout } from '@/app/actions/auth';
import ChangePasswordDialog from './ChangePasswordDialog';
import { ThemeToggle } from '@/components/ThemeToggle';

export interface PendingReservation {
  id: string;
  customerName: string;
  guestCount: number;
  time: string;
  tables: string[];
}

interface LiveOpsDashboardProps {
  tenantId: string;
  tenant: { name: string };
  pendingReservations: PendingReservation[];
  tables: LiveTable[];
}

export default function LiveOpsDashboard({ tenantId, tenant, pendingReservations, tables }: LiveOpsDashboardProps) {
  const [selectedTableIds, setSelectedTableIds] = useState<Set<string>>(new Set());
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleTableSelection = (tableId: string) => {
    const newSet = new Set(selectedTableIds);
    if (newSet.has(tableId)) {
      newSet.delete(tableId);
    } else {
      newSet.add(tableId);
    }
    setSelectedTableIds(newSet);
  };

  const clearSelection = () => setSelectedTableIds(new Set());

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans flex flex-col transition-colors duration-200">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Live Operations</h1>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:block">{tenant.name}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Live Updates</span>
            </div>
            
            <button 
              onClick={() => setIsChangePasswordOpen(true)}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Change Password
            </button>
            <form action={logout}>
              <button type="submit" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center justify-between">
              Reservations
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 py-0.5 px-2 rounded-full text-xs">{pendingReservations.length}</span>
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <PendingQueue reservations={pendingReservations} />
          </div>
        </div>

        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="absolute top-4 right-4 z-50">
            <div className="text-right">
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>

          <WalkInBar 
            tenantId={tenantId}
            selectedTableIds={Array.from(selectedTableIds)} 
            onClearSelection={clearSelection}
          />
          
          <AlertsPanel tenantId={tenantId} />
          
          <div className="flex-1 p-8 overflow-auto flex items-center justify-center">
            <LiveFloorPlan 
              tables={tables} 
              selectedTableIds={selectedTableIds}
              onTableClick={toggleTableSelection}
            />
          </div>
        </div>
      </main>

      <ChangePasswordDialog 
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
