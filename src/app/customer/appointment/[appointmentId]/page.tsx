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

const AVAILABLE_TIMES = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM',
];

const DISPLAY_TIMES = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM',
];

// Helper function to check if there are enough consecutive available slots
function hasEnoughConsecutiveSlots(
  startTime: string,
  durationMinutes: number,
  timeSlotsForDate: Array<{ time: string; available: boolean; reason: string | null }>
): boolean {
  const startIndex = AVAILABLE_TIMES.indexOf(startTime);
  if (startIndex === -1) return false;

  const slotsNeeded = Math.ceil(durationMinutes / 30);

  for (let i = 0; i < slotsNeeded; i++) {
    const slotIndex = startIndex + i;
    if (slotIndex >= AVAILABLE_TIMES.length) return false;

    const slotTime = AVAILABLE_TIMES[slotIndex];
    const slot = timeSlotsForDate.find((s) => s.time === slotTime);
    if (!slot || !slot.available) return false;
  }

  return true;
}

// Calendar component
function CalendarComponent({ 
  selectedDate, 
  onDateSelect, 
  availableTimeSlotsMap,
  serviceType,
  duration
}: { 
  selectedDate: string; 
  onDateSelect: (date: string) => void;
  availableTimeSlotsMap: { [date: string]: Array<{ time: string; available: boolean; reason: string | null }> };
  serviceType: string;
  duration: number;
}) {
  const [displayMonth, setDisplayMonth] = useState(0);

  const now = new Date();
  const startDate = new Date(now);
  
  const availableDates = new Set<string>();
  for (let i = 0; i < 60; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    availableDates.add(dateString);
  }

  const displayDate = new Date(now);
  displayDate.setMonth(displayDate.getMonth() + displayMonth);
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const canGoPrev = displayMonth > 0;
  const canGoNext = displayMonth < 2;

  return (
    <div className="bg-black p-4 rounded-lg border-2 border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setDisplayMonth(displayMonth - 1)}
          disabled={!canGoPrev}
          className={`px-2 py-1 text-lg font-bold transition ${
            canGoPrev
              ? 'text-gray-400 hover:text-gray-300 cursor-pointer'
              : 'text-gray-700 cursor-not-allowed'
          }`}
        >
          &lt;
        </button>
        <h3 className="text-lg font-semibold text-white flex-1 text-center">{monthName}</h3>
        <button
          type="button"
          onClick={() => setDisplayMonth(displayMonth + 1)}
          disabled={!canGoNext}
          className={`px-2 py-1 text-lg font-bold transition ${
            canGoNext
              ? 'text-gray-400 hover:text-gray-300 cursor-pointer'
              : 'text-gray-700 cursor-not-allowed'
          }`}
        >
          &gt;
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-semibold text-gray-400 text-sm">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} />;
          }
          
          const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isWithin60Days = availableDates.has(dateString);
          const isSelected = selectedDate === dateString;
          
          const timeSlotsForDate = availableTimeSlotsMap[dateString];
          const hasAvailableTimes = timeSlotsForDate ? timeSlotsForDate.some((slot) => slot.available) : isWithin60Days;
          const canBook = isWithin60Days && hasAvailableTimes;
          
          return (
            <button
              key={day}
              type="button"
              onClick={() => canBook && onDateSelect(dateString)}
              disabled={!canBook}
              className={`p-2 rounded-lg font-semibold text-sm transition w-full h-full flex items-center justify-center ${
                isSelected
                  ? 'bg-pink-500 text-white border-2 border-pink-600'
                  : canBook
                  ? 'bg-black text-white border-2 border-gray-700 hover:border-pink-500 hover:bg-gray-800 cursor-pointer'
                  : 'bg-gray-900 text-gray-600 border-2 border-gray-900 cursor-not-allowed'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CustomerAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [availableTimeSlotsMap, setAvailableTimeSlotsMap] = useState<{ [date: string]: Array<{ time: string; available: boolean; reason: string | null }> }>({});
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);

  // Edit form state
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editNailArtNotes, setEditNailArtNotes] = useState<string>('');

  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch availability on mount
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const response = await fetch(`/api/availability-60-days?t=${Date.now()}`);
        const data = await response.json();
        if (data.success && data.dates) {
          setAvailableTimeSlotsMap(data.dates);
        }
      } catch (error) {
        console.error('Failed to fetch availability:', error);
      }
    };
    fetchAvailability();
  }, []);

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
        setEditDate(data.appointment.booking_date);
        setEditTime(data.appointment.booking_time);
        setEditNailArtNotes(data.appointment.nail_art_notes || '');
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

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/appointments/edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          newDate: editDate,
          newTime: editTime,
          nailArtNotes: editNailArtNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      setSuccess(true);
      setIsEditing(false);

      // Refresh appointment data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/appointments/cancel?appointmentId=${appointmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }

      setSuccess(true);
      setShowCancelModal(false);

      // Redirect after success
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-pink-300 border-r-pink-600"></div>
            <p className="mt-4 text-gray-600">Loading your appointment...</p>
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

  const statusColor = appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Appointment</h1>
          <div className={`inline-block px-4 py-2 rounded-full font-semibold ${statusColor}`}>
            {appointment.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending Confirmation'}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
            <p className="text-green-700 font-bold">✅ Changes saved! Redirecting...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Appointment Details Card */}
        {!isEditing ? (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-pink-600 mb-6">Appointment Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <p className="text-lg text-gray-900">{formattedDate}</p>
              </div>

              {/* Time */}
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

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <p className="text-lg text-gray-900">{appointment.customer_phone}</p>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {appointment.status === 'confirmed' ? 'Total Price' : 'Estimated Price'}
                </label>
                <p className="text-lg font-bold text-pink-600">${appointment.total_price.toFixed(2)}</p>
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

            {/* Info Message */}
            {appointment.status === 'pending' && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded">
                <p className="text-blue-700">
                  <strong>Note:</strong> This appointment is pending confirmation from Kinsey. You can still edit or cancel it.
                </p>
              </div>
            )}

            {appointment.status === 'confirmed' && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8 rounded">
                <p className="text-green-700">
                  <strong>Confirmed!</strong> Your appointment has been confirmed. If you need to reschedule, you can still edit it below.
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* Edit Form - Simplified Booking */}
        {isEditing && (
          <form onSubmit={handleEdit} className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-pink-600 mb-6">Reschedule Appointment</h2>

            <div className="space-y-6">
              {/* Service (Pre-selected, read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
                <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
                  <p className="text-lg font-semibold text-gray-900">{serviceName}</p>
                  <p className="text-sm text-gray-600 mt-1">Duration: {appointment.duration} minutes</p>
                </div>
              </div>

              {/* Calendar - Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select New Date</label>
                <CalendarComponent 
                  selectedDate={editDate} 
                  onDateSelect={setEditDate}
                  availableTimeSlotsMap={availableTimeSlotsMap}
                  serviceType={appointment.service_id}
                  duration={appointment.duration}
                />
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select New Time</label>
                <div className="grid grid-cols-4 gap-2">
                  {DISPLAY_TIMES.map((time) => {
                    const timeSlotsForDate = availableTimeSlotsMap[editDate];
                    const hasSlots = hasEnoughConsecutiveSlots(time, appointment.duration, timeSlotsForDate || []);
                    const isSelected = editTime === time;

                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => hasSlots && setEditTime(time)}
                        disabled={!hasSlots || submitting}
                        className={`p-3 rounded-lg font-semibold text-sm transition ${
                          isSelected
                            ? 'bg-pink-500 text-white border-2 border-pink-600'
                            : hasSlots
                            ? 'bg-white text-gray-900 border-2 border-gray-300 hover:border-pink-500 hover:bg-pink-50 cursor-pointer'
                            : 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nail Art Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nail Art Notes (Optional)</label>
                <textarea
                  value={editNailArtNotes}
                  onChange={(e) => setEditNailArtNotes(e.target.value)}
                  disabled={submitting}
                  rows={4}
                  placeholder="Any special requests or design ideas..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Info */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-blue-700 text-sm">
                  <strong>Note:</strong> When you save changes, Kinsey will be notified and will need to re-confirm your appointment.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end mt-8">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={submitting}
                className="px-6 py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !editDate || !editTime}
                className="px-8 py-3 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                    Saving...
                  </>
                ) : (
                  '💾 Save Changes'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={() => setIsEditing(true)}
              className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
            >
              ✏️ Edit Appointment
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
            >
              ✕ Cancel Appointment
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition"
            >
              ← Back Home
            </button>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
              <h3 className="text-2xl font-bold text-red-600 mb-4">Cancel Appointment?</h3>
              <p className="text-gray-700 mb-6">
                Are you sure you want to cancel this appointment? This action cannot be undone, and Kinsey will be notified.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Keep Appointment
                </button>
                <button
                  onClick={handleCancel}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                      Cancelling...
                    </>
                  ) : (
                    '✓ Yes, Cancel'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
