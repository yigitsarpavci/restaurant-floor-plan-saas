'use client';

import React, { useState, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { useFloorPlanStore, TableItem, TableShapeType } from './store';

const GRID_SIZE = 20;

const checkCollision = (
  id: string,
  newBounds: { x: number; y: number; width: number; height: number },
  tables: TableItem[]
) => {
  return tables.some((t) => {
    if (t.id === id) return false;
    return (
      newBounds.x < t.x + t.width &&
      newBounds.x + newBounds.width > t.x &&
      newBounds.y < t.y + t.height &&
      newBounds.y + newBounds.height > t.y
    );
  });
};

export default function Canvas() {
  const { tables, selectedTableId, updateTable, setSelectedTable, addTable } = useFloorPlanStore();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const applyZoom = (newZoom: number, mouseX?: number, mouseY?: number) => {
    if (newZoom === zoom) return;
    const container = canvasRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const targetX = mouseX !== undefined ? mouseX - rect.left : rect.width / 2;
      const targetY = mouseY !== undefined ? mouseY - rect.top : rect.height / 2;

      // logical point under the target
      const logicalX = (targetX - pan.x) / zoom;
      const logicalY = (targetY - pan.y) / zoom;

      // new pan to keep the logical point under the target
      const newPanX = targetX - logicalX * newZoom;
      const newPanY = targetY - logicalY * newZoom;

      setPan({ x: newPanX, y: newPanY });
      setZoom(newZoom);
    } else {
      setZoom(newZoom);
    }
  };

  const handleZoomIn = () => applyZoom(Math.min(zoom + 0.1, 2));
  const handleZoomOut = () => applyZoom(Math.max(zoom - 0.1, 0.5));
  const handleResetZoom = () => applyZoom(1);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const newZoom = e.deltaY < 0 ? Math.min(zoom + 0.1, 2) : Math.max(zoom - 0.1, 0.5);
      applyZoom(newZoom, e.clientX, e.clientY);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target === canvasRef.current) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleDragStop = (id: string, d: any) => {
    const table = tables.find(t => t.id === id);
    if (!table) return;
    
    // Force absolute grid snap (fixes misaligned tables spawned at off-grid coordinates)
    const snapX = Math.round(d.x / GRID_SIZE) * GRID_SIZE;
    const snapY = Math.round(d.y / GRID_SIZE) * GRID_SIZE;

    const newBounds = { x: snapX, y: snapY, width: table.width, height: table.height };
    if (!checkCollision(id, newBounds, tables)) {
      updateTable(id, { x: snapX, y: snapY });
    } else {
      // Small trick to force Rnd to reset to original position on collision
      updateTable(id, { x: table.x + 0.0001 });
      setTimeout(() => updateTable(id, { x: table.x }), 50);
    }
  };

  const handleResizeStop = (id: string, e: any, direction: any, ref: any, delta: any, position: any) => {
    const table = tables.find(t => t.id === id);
    if (!table) return;

    const newWidth = Math.round(parseInt(ref.style.width, 10) / GRID_SIZE) * GRID_SIZE;
    const newHeight = Math.round(parseInt(ref.style.height, 10) / GRID_SIZE) * GRID_SIZE;
    const snapX = Math.round(position.x / GRID_SIZE) * GRID_SIZE;
    const snapY = Math.round(position.y / GRID_SIZE) * GRID_SIZE;
    
    const newBounds = { x: snapX, y: snapY, width: newWidth, height: newHeight };
    
    if (!checkCollision(id, newBounds, tables)) {
      updateTable(id, {
        width: newWidth,
        height: newHeight,
        x: snapX,
        y: snapY,
      });
    } else {
      updateTable(id, { width: table.width + 0.0001 });
      setTimeout(() => updateTable(id, { width: table.width }), 50);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const shape = e.dataTransfer.getData('shape') as TableShapeType;
    if (!shape) return;

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate logical X and Y factoring in pan and zoom
    const rawX = (mouseX - pan.x) / zoom;
    const rawY = (mouseY - pan.y) / zoom;

    // Snap to grid
    const x = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
    const y = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

    const width = shape === 'CIRCLE' ? 60 : 80;
    const height = shape === 'CIRCLE' ? 60 : 80;

    // Check collision for new spawn
    const newBounds = { x, y, width, height };
    if (!checkCollision('new', newBounds, tables)) {
      addTable({
        name: `T${Math.floor(Math.random() * 100)}`,
        x,
        y,
        width,
        height,
        capacity: 4,
        shape,
      });
    } else {
      alert("Cannot drop here: Overlaps with an existing table.");
    }
  };

  const getShapeClasses = (table: TableItem) => {
    const base = 'flex items-center justify-center font-bold text-sm shadow-md transition-shadow cursor-move ring-inset ';
    const isSelected = selectedTableId === table.id;
    const isSelectedClasses = isSelected ? 'ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 ring-1 ring-gray-300 dark:ring-gray-600';
    
    switch (table.shape) {
      case 'CIRCLE': return base + isSelectedClasses + ' rounded-full';
      case 'SQUARE': return base + isSelectedClasses + ' rounded-sm';
      case 'BOOTH': return base + isSelectedClasses + ' rounded-lg rounded-tr-none';
      case 'RECTANGLE':
      default: return base + isSelectedClasses + ' rounded-md';
    }
  };

  return (
    <div className="flex-1 relative flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 z-50 flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
        </button>
        <button onClick={handleResetZoom} className="px-3 py-2 text-xs font-medium border-x border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors w-14 text-center">
          {Math.round(zoom * 100)}%
        </button>
        <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      <div 
        ref={canvasRef}
        className={`flex-1 relative overflow-hidden w-full h-full bg-gray-50 dark:bg-gray-950 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(150, 150, 150, 0.25) 1px, transparent 0)',
          backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedTable(null);
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
          {tables.map((table) => (
            <Rnd
              key={table.id}
              scale={zoom}
              size={{ width: table.width, height: table.height }}
              position={{ x: table.x, y: table.y }}
              onDragStop={(e, d) => handleDragStop(table.id, d)}
              onResizeStop={(e, direction, ref, delta, position) => handleResizeStop(table.id, e, direction, ref, delta, position)}
              dragGrid={[GRID_SIZE, GRID_SIZE]}
              resizeGrid={[GRID_SIZE, GRID_SIZE]}
              onMouseDown={(e) => {
                e.stopPropagation();
                setSelectedTable(table.id);
              }}
              className={getShapeClasses(table)}
            >
              <div className="flex flex-col items-center justify-center pointer-events-none select-none h-full w-full">
                 <span>{table.name}</span>
                 <span className="text-[10px] opacity-70">P: {table.capacity}</span>
              </div>
            </Rnd>
          ))}
        </div>
      </div>
    </div>
  );
}
