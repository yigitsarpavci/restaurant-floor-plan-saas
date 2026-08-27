'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import { useFloorPlanStore, TableItem } from './store';
import { saveFloorPlanLayout } from '@/app/actions/floor-plan';
import { logout } from '@/app/actions/auth';

interface FloorPlanBuilderProps {
  floorPlanId: string;
  initialTables?: TableItem[];
}

export default function FloorPlanBuilder({ floorPlanId, initialTables }: FloorPlanBuilderProps) {
  const tables = useFloorPlanStore((state) => state.tables);
  const setTables = useFloorPlanStore((state) => state.setTables);
  const [isSaving, setIsSaving] = useState(false);

  // Load tables from DB into Zustand store on mount
  useEffect(() => {
    if (initialTables && initialTables.length > 0) {
      setTables(initialTables);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveFloorPlanLayout(floorPlanId, tables);
      alert('Floor plan saved successfully!');
    } catch (error) {
      console.error('Failed to save floor plan:', error);
      alert('Failed to save floor plan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
      {/* Header */}
      <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 shrink-0">
        <h1 className="font-semibold text-gray-800 dark:text-gray-100">Floor Plan Designer</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => logout()}
            className="px-5 py-2.5 rounded-lg font-medium text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-sm"
          >
            Logout
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Layout'}
          </button>
        </div>
      </div>
      
      {/* Main Designer Area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Canvas />
        <PropertiesPanel />
      </div>
    </div>
  );
}
