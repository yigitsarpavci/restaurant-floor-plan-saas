'use client';

import React, { useState } from 'react';
import EditTenantDialog from './EditTenantDialog';
import { deleteTenant } from '@/app/actions/tenant';
import { useRouter } from 'next/navigation';

interface TenantHeaderActionsProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function TenantHeaderActions({ tenant }: TenantHeaderActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this restaurant? This action cannot be undone and will delete all floor plans and reservations.')) {
      setIsDeleting(true);
      const res = await deleteTenant(tenant.id);
      if (res.success) {
        router.push('/manage');
      } else {
        alert(res.error || 'Failed to delete restaurant');
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsEditOpen(true)}
          className="text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
        >
          Edit Details
        </button>
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Delete Restaurant'}
        </button>
      </div>

      <EditTenantDialog 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        tenant={tenant} 
      />
    </>
  );
}
