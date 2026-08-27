'use client';

import React from 'react';
import { useFloorPlanStore, TableShapeType } from './store';

export default function Sidebar() {
  const addTable = useFloorPlanStore((state) => state.addTable);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, shape: TableShapeType) => {
    e.dataTransfer.setData('shape', shape);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 h-full flex flex-col shrink-0">
      <h3 className="font-bold text-gray-900 dark:text-white mb-6">Elements</h3>
      
      <div className="space-y-4">
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'RECTANGLE')}
          className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors cursor-grab active:cursor-grabbing"
        >
          <div className="w-8 h-6 bg-gray-300 dark:bg-gray-600 rounded-sm pointer-events-none"></div>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 pointer-events-none">Add Table</span>
        </div>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'CIRCLE')}
          className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors cursor-grab active:cursor-grabbing"
        >
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full mx-1 pointer-events-none"></div>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 pointer-events-none">Add Round Table</span>
        </div>
      </div>
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
         <p className="text-xs text-gray-400 dark:text-gray-500">Click to add elements to the canvas. Drag to move them.</p>
      </div>
    </div>
  );
}
