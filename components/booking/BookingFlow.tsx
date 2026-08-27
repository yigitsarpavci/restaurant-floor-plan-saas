'use client';

import React, { useState } from 'react';
import { checkAvailability } from '@/app/actions/booking';
import CustomerFloorPlan, { PublicTable } from './CustomerFloorPlan';
import BookingDialog from './BookingDialog';

interface BookingFlowProps {
  tenantId: string;
  initialTables: PublicTable[];
}

export default function BookingFlow({ tenantId, initialTables }: BookingFlowProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [tables, setTables] = useState<PublicTable[]>(initialTables);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTable, setSelectedTable] = useState<PublicTable | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;
    
    setIsSearching(true);
    try {
      const availabilityMap = await checkAvailability(tenantId, date, time);
      const updatedTables = initialTables.map(t => {
        const availability = availabilityMap[t.id];
        return {
          ...t,
          status: availability ? availability.status : 'AVAILABLE',
          availableUntil: availability?.availableUntil
        };
      });
      setTables(updatedTables as PublicTable[]);
      setHasSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 dark:bg-gray-950 dark:text-white">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-bold mb-4">Find a Table</h2>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input 
              type="date" 
              required
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md p-2 outline-none focus:border-black dark:focus:border-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
            <input 
              type="time" 
              required
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md p-2 outline-none focus:border-black dark:focus:border-white"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guests</label>
            <input 
              type="number" 
              min={1}
              required
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md p-2 outline-none focus:border-black dark:focus:border-white"
              value={guestCount}
              onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
            />
          </div>
          <button 
            type="submit"
            disabled={isSearching}
            className="bg-black dark:bg-white text-white dark:text-black px-8 py-2 rounded-md font-medium hover:bg-gray-800 dark:hover:bg-gray-200 h-[42px] transition-colors disabled:opacity-50"
          >
            {isSearching ? 'Checking...' : 'Check Availability'}
          </button>
        </form>
      </div>

      {hasSearched && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold">Select your Table</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-200 border border-green-300"></span> Available</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-200 border border-orange-300"></span> Partly Available</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-200 border border-red-300"></span> Booked</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300"></span> Too Small</span>
            </div>
          </div>
          <CustomerFloorPlan 
            tables={tables} 
            guestCount={guestCount}
            onTableSelect={(table) => setSelectedTable(table)}
          />
        </div>
      )}

      {selectedTable && (
        <BookingDialog
          isOpen={!!selectedTable}
          onClose={() => setSelectedTable(null)}
          selectedTableId={selectedTable.id}
          tenantId={tenantId}
          date={date}
          time={time}
          guestCount={guestCount}
          availableUntil={selectedTable.availableUntil}
        />
      )}
    </div>
  );
}
