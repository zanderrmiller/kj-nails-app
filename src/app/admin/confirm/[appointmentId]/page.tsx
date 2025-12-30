'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  service_id: string;
  duration: number;
  total_price: number;
  status: string;
  addons: string[];
  nail_art_notes: string | null;
}

const BASE_SERVICES: Record<string, { name: string; duration: number; basePrice: number }> = {
  acrylicfill: { name: 'Acrylic Fill', duration: 45, basePrice: 35 },
  acrylicset: { name: 'Acrylic Set', duration: 60, basePrice: 45 },
  polygel: { name: 'PolyGel', duration: 45, basePrice: 40 },
  manicure: { name: 'Manicure', duration: 30, basePrice: 25 },
};

const ADD_ON_PRICES: Record<string, number> = {
  removal: 10,
  nailart: 20,
  design: 15,
};

export default function ConfirmAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/appointments/confirm?appointmentId=${appointmentId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch appointment');
        }

        const data = await response.json();
        setAppointment(data.appointment);
        setFinalPrice(data.appointment.total_price);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load appointment');
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      setError(null);

      const response = await fetch('/api/appointments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          finalPrice,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm appointment');
      }

      setSuccess(true);

      // Redirect to admin dashboard after 3 seconds
      setTimeout(() => {
        router.push('/admin');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm appointment');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-pink-300 border-r-pink-600"></div>
            <p className="mt-4 text-gray-600">Loading appointment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
            <h2 className="font-bold mb-2">Error Loading Appointment</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
          <p className="text-center text-gray-600">Appointment not found</p>
        </div>
      </div>
    );
  }

  const serviceName = BASE_SERVICES[appointment.service_id]?.name || appointment.service_id;
  const formattedDate = new Date(`${appointment.booking_date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const [hours, minutes] = appointment.booking_time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  const formattedTime = `${formattedHour}:${minutes} ${ampm}`;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Appointment Confirmation</h1>
          <p className="text-gray-600">Review and confirm this appointment</p>
        </div>

        {/* Appointment Details Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-pink-600">Customer Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <p className="text-lg text-gray-900">{appointment.customer_name}</p>
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <p className="text-lg text-gray-900">{appointment.customer_phone}</p>
            </div>

            {/* Appointment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <p className="text-lg text-gray-900">{formattedDate}</p>
            </div>

            {/* Appointment Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <p className="text-lg text-gray-900">{formattedTime}</p>
            </div>

            {/* Service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
              <p className="text-lg text-gray-900">{serviceName}</p>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <p className="text-lg text-gray-900">{appointment.duration} minutes</p>
            </div>
          </div>

          {/* Add-ons */}
          {appointment.addons && appointment.addons.length > 0 && (
            <div className="mb-8 pb-8 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">Add-ons</label>
              <div className="space-y-2">
                {appointment.addons.map((addonId) => (
                  <p key={addonId} className="text-gray-900">
                    • {addonId.charAt(0).toUpperCase() + addonId.slice(1)}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Nail Art Notes */}
          {appointment.nail_art_notes && (
            <div className="mb-8 pb-8 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nail Art Notes</label>
              <p className="text-gray-900 whitespace-pre-wrap">{appointment.nail_art_notes}</p>
            </div>
          )}

          {/* Final Price Input */}
          <div className="bg-pink-50 rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Final Price</label>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-700">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={finalPrice}
                onChange={(e) => setFinalPrice(parseFloat(e.target.value) || 0)}
                className="text-2xl font-bold text-pink-600 bg-white border-2 border-pink-200 rounded px-4 py-2 w-full max-w-xs focus:outline-none focus:border-pink-500"
                disabled={confirming}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">Original price: ${appointment.total_price.toFixed(2)}</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
            <p className="text-green-700 font-bold">✅ Appointment confirmed! Redirecting...</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.back()}
            disabled={confirming}
            className="px-6 py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="px-8 py-3 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {confirming ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                Confirming...
              </>
            ) : (
              '✓ Confirm Appointment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
