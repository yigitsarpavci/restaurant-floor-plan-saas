'use client';

import React from 'react';

export interface PublicTable {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
  shape: 'RECTANGLE' | 'CIRCLE' | 'SQUARE' | 'BOOTH';
  status: 'AVAILABLE' | 'BOOKED' | 'PARTLY_AVAILABLE';
  availableUntil?: string; // ISO string
}

interface CustomerFloorPlanProps {
  tables: PublicTable[];
  guestCount: number;
  onTableSelect: (table: PublicTable) => void;
}

export default function CustomerFloorPlan({ tables, guestCount, onTableSelect }: CustomerFloorPlanProps) {
  
  const getShapeClasses = (table: PublicTable) => {
    let base = 'absolute flex items-center justify-center font-bold text-sm shadow-sm transition-all ';
    
    // Logic for availability
    const tooSmall = table.capacity < guestCount;
    
    if (table.status === 'BOOKED') {
      base += 'bg-red-100 border-red-300 text-red-800 cursor-not-allowed opacity-70 ';
    } else if (tooSmall) {
      base += 'bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed opacity-50 ';
    } else if (table.status === 'PARTLY_AVAILABLE') {
      base += 'bg-orange-100 border-orange-300 text-orange-800 cursor-pointer hover:bg-orange-200 hover:scale-105 ';
    } else {
      // AVAILABLE
      base += 'bg-green-100 border-green-300 text-green-800 cursor-pointer hover:bg-green-200 hover:scale-105 ';
    }

    base += ' border ';

    switch (table.shape) {
      case 'CIRCLE':
        return base + ' rounded-full';
      case 'SQUARE':
        return base + ' rounded-sm';
      case 'BOOTH':
        return base + ' rounded-lg rounded-tr-none';
      case 'RECTANGLE':
      default:
        return base + ' rounded-md';
    }
  };

  return (
    <div className="relative w-full h-[600px] bg-white border border-gray-200 rounded-xl overflow-hidden mt-6 shadow-inner">
      {tables.map(table => {
        const tooSmall = table.capacity < guestCount;
        return (
          <div
            key={table.id}
            className={getShapeClasses(table)}
            style={{
              left: table.x,
              top: table.y,
              width: table.width,
              height: table.height,
            }}
            onClick={() => {
              if (table.status !== 'BOOKED' && !tooSmall) {
                onTableSelect(table);
              }
            }}
          >
            <div className="flex flex-col items-center select-none pointer-events-none">
              <span>{table.name}</span>
              <span className="text-[10px] opacity-70">Max: {table.capacity}</span>
              {table.status === 'PARTLY_AVAILABLE' && table.availableUntil && (
                <span className="text-[9px] opacity-90 tracking-tight font-medium mt-0.5">
                  Till {new Date(table.availableUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  );
}
