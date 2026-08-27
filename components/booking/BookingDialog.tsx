'use client';

import React, { useState } from 'react';
import { submitReservation } from '@/app/actions/booking';

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTableId: string;
  tenantId: string;
  date: string;
  time: string;
  guestCount: number;
  availableUntil?: string;
}

export default function BookingDialog({ isOpen, onClose, selectedTableId, tenantId, date, time, guestCount, availableUntil }: BookingDialogProps) {
  const [formData, setFormData] = useState({ customerName: '', phoneNumber: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset all state when dialog closes
    setFormData({ customerName: '', phoneNumber: '', email: '' });
    setError(null);
    setSuccess(false);
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await submitReservation({
        ...formData,
        date,
        time,
        endTime: availableUntil,
        guestCount,
        tableIds: [selectedTableId],
        tenantId
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Your request is sent to the restaurant for approval. You will be notified shortly.
            </p>
            <button 
              onClick={handleClose}
              className="px-6 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Booking</h2>
            <p className="text-sm text-gray-500 mb-6">
              Requesting table for {guestCount} guests on {date} at {time}.
            </p>

            {availableUntil && (
              <div className="bg-orange-50 text-orange-800 p-4 rounded-md text-sm mb-6 border border-orange-200">
                <strong className="block mb-1">Bilgilendirme: Kısıtlı Süre</strong>
                Bu masanın saat {new Date(availableUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}'te başka bir rezervasyonu bulunmaktadır. 
                İşlemi onaylarsanız sadece o saate kadar masada kalabilirsiniz.
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                  value={formData.customerName}
                  onChange={e => setFormData({...formData, customerName: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  required
                  type="tel" 
                  className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                  value={formData.phoneNumber}
                  onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                  placeholder="+90 555 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  required
                  type="email" 
                  className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Submitting...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
