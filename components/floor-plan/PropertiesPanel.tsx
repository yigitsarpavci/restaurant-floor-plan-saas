'use client';

import React from 'react';
import { useFloorPlanStore } from './store';

export default function PropertiesPanel() {
  const { tables, selectedTableId, updateTable, removeTable, setSelectedTable } = useFloorPlanStore();
  
  const selectedTable = tables.find((t) => t.id === selectedTableId);

  if (!selectedTable) {
    return (
      <div className="w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center justify-center text-center shrink-0 h-full">
        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-700">
          <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Select a table on the canvas to view and edit its properties.</p>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Properties</h2>
        <button 
          onClick={() => setSelectedTable(null)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
        >
          Close
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Table Label / Number</label>
          <input
            type="text"
            value={selectedTable.name}
            onChange={(e) => updateTable(selectedTable.id, { name: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Capacity</label>
          <input
            type="number"
            min={1}
            value={selectedTable.capacity || ''}
            onChange={(e) => updateTable(selectedTable.id, { capacity: parseInt(e.target.value) || 0 })}
            onBlur={(e) => {
              if (!selectedTable.capacity || selectedTable.capacity < 1) {
                updateTable(selectedTable.id, { capacity: 1 });
              }
            }}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="pt-6">
           <button
             onClick={() => removeTable(selectedTable.id)}
             className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-sm font-medium transition-colors"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             Delete Table
           </button>
        </div>
      </div>
    </div>
  );
}
