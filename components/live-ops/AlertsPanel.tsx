'use client';

import React, { useEffect, useState } from 'react';
import { fetchLiveAlerts, markNoShow, keepHolding, markCleared, DashboardAlert } from '@/app/actions/alerts';

interface AlertsPanelProps {
  tenantId: string;
}

export default function AlertsPanel({ tenantId }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);

  // Simple polling mechanism. In production, use WebSockets or SSE for instant real-time.
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const data = await fetchLiveAlerts(tenantId);
        setAlerts(data);
      } catch (e) {
        console.error("Failed to load alerts", e);
      }
    };
    
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [tenantId]);

  if (alerts.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 z-50 flex flex-col gap-2 max-w-sm">
      {alerts.map((alert) => (
        <div key={alert.id} className="bg-white dark:bg-gray-800 border-l-4 border-red-500 rounded-lg shadow-lg p-3 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-bold text-red-700 dark:text-red-400 text-sm tracking-tight">
              {alert.type === 'NO_SHOW' ? 'No-Show Alert' : 'Overstay Warning'}
            </h4>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-200 mt-1.5 mb-4 font-medium leading-relaxed">
            {alert.message}
          </p>
          
          {alert.type === 'NO_SHOW' && (
            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  await markNoShow(alert.reservationId);
                  setAlerts(alerts.filter(a => a.id !== alert.id));
                }}
                className="flex-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 py-2 rounded-md text-xs font-bold transition-colors"
              >
                Mark No-Show
              </button>
              <button 
                onClick={async () => {
                  await keepHolding(alert.reservationId);
                  setAlerts(alerts.filter(a => a.id !== alert.id)); // Dismiss temporarily
                }}
                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 py-2 rounded-md text-xs font-bold transition-colors"
              >
                Keep Holding
              </button>
            </div>
          )}

          {alert.type === 'OVERSTAY' && (
            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  await markCleared(alert.reservationId);
                  setAlerts(alerts.filter(a => a.id !== alert.id));
                }}
                className="w-full bg-gray-900 text-white hover:bg-black py-2 rounded-md text-xs font-bold transition-colors"
              >
                Yes, Mark CLEARED
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
