'use client';

import React, { useState } from 'react';
import { adminUpdatePassword } from '@/app/actions/tenant';

interface AdminPasswordResetProps {
  tenantId: string;
  currentPassword: string;
}

export default function AdminPasswordReset({ tenantId, currentPassword }: AdminPasswordResetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!newPassword) return;
    setLoading(true);
    const res = await adminUpdatePassword(tenantId, newPassword);
    setLoading(false);
    if (res.success) {
      setIsEditing(false);
      setNewPassword('');
    } else {
      alert(res.error || 'Failed to update');
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-2.5 rounded-lg border border-green-200 dark:border-green-800">
        <div className="font-mono text-sm font-bold tracking-widest text-gray-900 dark:text-white">{currentPassword || 'Not Set'}</div>
        <button 
          onClick={() => setIsEditing(true)}
          className="text-xs text-green-700 dark:text-green-400 font-medium hover:text-green-900 dark:hover:text-green-300 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 px-2.5 py-1 rounded transition-colors"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-2 py-1.5 rounded-lg border border-green-300 dark:border-green-700">
      <input 
        type="text" 
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="New password"
        className="flex-1 font-mono text-sm outline-none px-2 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        autoFocus
      />
      <div className="flex items-center gap-1">
        <button 
          onClick={() => setIsEditing(false)}
          disabled={loading}
          className="text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
        >
          Cancel
        </button>
        <button 
          onClick={handleUpdate}
          disabled={loading || !newPassword}
          className="text-xs text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 px-2 py-1 rounded font-medium disabled:opacity-50"
        >
          {loading ? '...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
