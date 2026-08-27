'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createWalkIn } from '@/app/actions/live-ops';

interface WalkInBarProps {
  tenantId: string;
  selectedTableIds: string[];
  onClearSelection: () => void;
}

export default function WalkInBar({ tenantId, selectedTableIds, onClearSelection }: WalkInBarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [partySize, setPartySize] = useState(2);
  const [customerName, setCustomerName] = useState('');

  const handleSeatWalkIn = async () => {
    if (selectedTableIds.length === 0) return;
    setLoading(true);
    try {
      await createWalkIn(tenantId, selectedTableIds);
      onClearSelection();
      router.refresh();
    } catch (e) {
      alert('Failed to seat walk-in.');
    } finally {
      setLoading(false);
    }
  };

  if (selectedTableIds.length === 0) {
    return (
      <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-6 shadow-sm z-10 transition-colors">
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Select available tables on the floor plan to seat a Walk-In.</p>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl px-6 py-4 flex items-center gap-6 transform transition-all">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Walk-in Customer</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Select tables to seat directly</p>
        </div>
      </div>
      
      <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

      <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Party Size</label>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPartySize(Math.max(1, partySize - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            >
              -
            </button>
            <span className="w-6 text-center font-bold text-gray-900 dark:text-white">{partySize}</span>
            <button 
              onClick={() => setPartySize(partySize + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            >
              +
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Customer Name (Opt)</label>
          <input 
            type="text" 
            placeholder="Walk-in"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="w-32 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-black dark:focus:border-white transition-colors bg-white dark:bg-gray-800 dark:text-white"
          />
        </div>

        <button
          onClick={handleSeatWalkIn}
          disabled={loading || selectedTableIds.length === 0}
          className="ml-2 bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? 'Seating...' : `Seat at ${selectedTableIds.length} Table${selectedTableIds.length > 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
