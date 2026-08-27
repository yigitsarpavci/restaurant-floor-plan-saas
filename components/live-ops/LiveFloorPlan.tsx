'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateReservationStatus } from '@/app/actions/live-ops';
import { ReservationStatus } from '@prisma/client';

export interface LiveTable {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
  shape: 'RECTANGLE' | 'CIRCLE' | 'SQUARE' | 'BOOTH';
  status: 'AVAILABLE' | 'SEATED' | 'CLEARED' | 'CONFIRMED';
  activeReservationId?: string;
  nextReservationTime?: string;
}

interface LiveFloorPlanProps {
  tables: LiveTable[];
  selectedTableIds: Set<string>;
  onTableClick: (tableId: string) => void;
}

export default function LiveFloorPlan({ tables, selectedTableIds, onTableClick }: LiveFloorPlanProps) {
  const router = useRouter();
  const [menuData, setMenuData] = useState<{ x: number; y: number; tableId: string; reservationId: string } | null>(null);

  const handleTableClick = (e: React.MouseEvent, table: LiveTable) => {
    e.stopPropagation();
    
    // If occupied, open manual override context menu
    if (table.status !== 'AVAILABLE' && table.activeReservationId) {
      setMenuData({
        x: e.clientX,
        y: e.clientY,
        tableId: table.id,
        reservationId: table.activeReservationId
      });
      return;
    }

    // Otherwise, toggle selection for walk-in
    setMenuData(null);
    if (table.status === 'AVAILABLE') {
      onTableClick(table.id);
    }
  };

  const handleStatusOverride = async (status: ReservationStatus) => {
    if (!menuData) return;
    try {
      await updateReservationStatus(menuData.reservationId, status);
      router.refresh();
    } catch (error) {
      alert('Failed to update status');
    } finally {
      setMenuData(null);
    }
  };

  const getShapeClasses = (table: LiveTable) => {
    let base = 'absolute flex items-center justify-center font-bold text-sm shadow-sm transition-all ';
    
    const isSelected = selectedTableIds.has(table.id);

    if (isSelected) {
      base += 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 dark:border-blue-400 text-blue-800 dark:text-blue-100 scale-105 shadow-md cursor-pointer ';
    } else if (table.status === 'CONFIRMED') {
      base += 'bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-100 cursor-pointer ';
    } else if (table.status === 'SEATED') {
      base += 'bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-700 text-white shadow-inner cursor-pointer ';
    } else if (table.status === 'CLEARED') {
      base += 'bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-200 shadow-inner cursor-pointer ';
    } else {
      // AVAILABLE
      base += 'bg-green-100 dark:bg-gray-800 border border-green-400 dark:border-green-800 text-green-800 dark:text-green-400 cursor-pointer hover:bg-green-200 dark:hover:bg-gray-700 hover:scale-105 ';
    }

    switch (table.shape) {
      case 'CIRCLE': return base + ' rounded-full';
      case 'SQUARE': return base + ' rounded-sm';
      case 'BOOTH': return base + ' rounded-lg rounded-tr-none';
      case 'RECTANGLE': default: return base + ' rounded-md';
    }
  };

  return (
    <div 
      className="relative w-full max-w-5xl h-[700px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm transition-colors"
      onClick={() => setMenuData(null)}
      style={{
        backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px), radial-gradient(#374151 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px'
      }}
    >
      {tables.map(table => (
        <div
          key={table.id}
          className={getShapeClasses(table)}
          style={{
            left: table.x,
            top: table.y,
            width: table.width,
            height: table.height,
          }}
          onClick={(e) => handleTableClick(e, table)}
        >
          <div className="flex flex-col items-center pointer-events-none select-none">
            <span>{table.name}</span>
            {table.status !== 'AVAILABLE' && (
              <span className="text-[10px] opacity-90 tracking-wide mt-0.5">{table.status}</span>
            )}
            {table.status === 'AVAILABLE' && table.nextReservationTime && (
              <span className="text-[9px] opacity-80 tracking-tight mt-0.5 font-medium leading-none whitespace-nowrap">
                Till {table.nextReservationTime}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* Context Menu for Status Override */}
      {menuData && (
        <div 
          className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 py-1.5 w-48 animate-in fade-in zoom-in-95"
          style={{ left: menuData.x, top: menuData.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
            Manual Override
          </div>
          <button 
            onClick={() => handleStatusOverride(ReservationStatus.SEATED)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center gap-3"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Mark SEATED
          </button>
          <button 
            onClick={() => handleStatusOverride(ReservationStatus.CLEARED)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-500 transition-colors flex items-center gap-3"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span> Mark CLEARED
          </button>
        </div>
      )}
    </div>
  );
}
