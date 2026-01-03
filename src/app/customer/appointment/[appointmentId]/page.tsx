'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import NavMenu from '@/components/NavMenu';

// Service options matching booking page
const BASE_SERVICES = [
  { id: 'acrylic-short', name: 'Acrylic Sets - Short', duration: 120, basePrice: 50, type: 'acrylic' },
  { id: 'acrylic-long', name: 'Acrylic Sets - Long', duration: 150, basePrice: 60, type: 'acrylic' },
  { id: 'gel', name: 'Gel Manicure', duration: 60, basePrice: 35, type: 'gel' },
  { id: 'rebase', name: 'Rebase', duration: 60, basePrice: 40, type: 'rebase' },
];

const REMOVAL_SERVICE = {
  id: 'removal',
  name: 'Removal',
  duration: 45,
  price: 20,
};

const NAIL_ART = {
  id: 'nail-art',
  name: 'Nail Art',
  price: 'Variable',
  durationAdd: 60,
};

const NAIL_DESIGN = [
  { id: 'ombre', name: 'Ombre', price: 15, durationAdd: 60 },
  { id: 'french', name: 'French', price: 15, durationAdd: 60 },
];

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

function Calendar({ 
  selectedDate, 
  onDateSelect, 
  availableTimeSlotsMap,
  duration
}: { 
  selectedDate: string; 
  onDateSelect: (date: string) => void;
  availableTimeSlotsMap: { [date: string]: Array<{ time: string; available: boolean; reason: string | null }> };
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

export default function EditAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;

  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTimeSlotsMap, setAvailableTimeSlotsMap] = useState<{ [date: string]: Array<{ time: string; available: boolean; reason: string | null }> }>({});

  // Form state
  const [selectedBase, setSelectedBase] = useState('');
  const [hasRemoval, setHasRemoval] = useState(false);
  const [hasNailArt, setHasNailArt] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState('');
  const [nailArtPrice, setNailArtPrice] = useState(0);
  const [nailArtNotes, setNailArtNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch appointment and availability
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch appointment
        const appointmentResponse = await fetch(`/api/appointments/confirm?appointmentId=${appointmentId}`);
        if (!appointmentResponse.ok) throw new Error('Failed to fetch appointment');
        const appointmentData = await appointmentResponse.json();
        setAppointment(appointmentData.appointment);
        
        // Pre-select the current service based on appointment service_id
        const currentServiceId = appointmentData.appointment.service_id;
        let selectedServiceId = BASE_SERVICES[0].id;
        
        // Try to match the service
        if (currentServiceId.includes('acrylic')) {
          selectedServiceId = currentServiceId.includes('long') ? 'acrylic-long' : 'acrylic-short';
        } else if (currentServiceId.includes('gel')) {
          selectedServiceId = 'gel';
        } else if (currentServiceId.includes('rebase')) {
          selectedServiceId = 'rebase';
        }
        
        setSelectedBase(selectedServiceId);
        setSelectedDate(appointmentData.appointment.booking_date);
        setSelectedTime(appointmentData.appointment.booking_time);
        if (appointmentData.appointment.nail_art_notes) {
          setNailArtNotes(appointmentData.appointment.nail_art_notes);
        }

        // Fetch availability
        const availabilityResponse = await fetch(`/api/availability-60-days?t=${Date.now()}`);
        const availabilityData = await availabilityResponse.json();
        if (availabilityData.success && availabilityData.dates) {
          setAvailableTimeSlotsMap(availabilityData.dates);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchData();
    }
  }, [appointmentId]);

  const baseService = BASE_SERVICES.find((s) => s.id === selectedBase);

  let totalDuration = baseService?.duration || 0;
  let totalPrice = baseService?.basePrice || 0;

  if (hasRemoval) {
    totalDuration += REMOVAL_SERVICE.duration;
    totalPrice += REMOVAL_SERVICE.price;
  }

  if (baseService) {
    if (hasNailArt) {
      totalPrice += nailArtPrice;
      if (baseService.type === 'acrylic' || baseService.type === 'rebase') {
        totalDuration += NAIL_ART.durationAdd;
      }
    }

    if (selectedDesign) {
      const design = NAIL_DESIGN.find((d) => d.id === selectedDesign);
      if (design) {
        totalPrice += design.price;
        if (baseService.type === 'acrylic' || baseService.type === 'rebase') {
          if (!hasNailArt) {
            totalDuration += design.durationAdd;
          }
        }
      }
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!selectedDate || !selectedTime) {
        throw new Error('Please select a date and time');
      }

      const response = await fetch('/api/appointments/edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          newDate: selectedDate,
          newTime: selectedTime,
          nailArtNotes: nailArtNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      // Show success and redirect
      setTimeout(() => {
        router.push('/');
      }, 1500);
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

      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-pink-300 border-r-pink-600"></div>
          <p className="mt-4 text-gray-400">Loading appointment...</p>
        </div>
      </main>
    );
  }

  if (!appointment) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Appointment not found</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black shadow" style={{padding: 0, margin: 0}}>
        <div className="flex justify-between items-center" style={{height: '80px', padding: '4px 0 4px 10px', margin: 0, overflow: 'hidden'}}>
          <Link href="/" className="flex-shrink-0" style={{padding: 0, margin: 0, display: 'flex', alignItems: 'center', height: '72px'}}>
            <Image
              src="/images/clear logo.png"
              alt="KJ Nails Logo"
              width={200}
              height={200}
              style={{display: 'block', height: '64px', width: 'auto', margin: 0, padding: 0}}
              priority
            />
          </Link>
          <div style={{margin: 0, height: '100%', marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: '16px'}}>
            <NavMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-12">
        {/* Cancel Button at Top */}
        <div className="mb-6">
          <button
            onClick={() => setShowCancelModal(true)}
            disabled={submitting}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel Appointment
          </button>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6 sm:mb-8 text-center">Edit Your Appointment</h1>

        {error && (
          <div className="bg-red-900 border-l-4 border-red-600 p-4 mb-6 rounded text-red-100">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleEdit} className="bg-black rounded-lg shadow-lg p-4 sm:p-8 border border-gray-700">
          {/* Service Selection */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Select Your Nail Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 sm:gap-2">
              {BASE_SERVICES.map((svc) => (
                <label
                  key={svc.id}
                  className={`p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition text-center text-xs sm:text-sm ${
                    selectedBase === svc.id
                      ? 'border-gray-400 bg-gray-800'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="service"
                    value={svc.id}
                    checked={selectedBase === svc.id}
                    onChange={(e) => setSelectedBase(e.target.value)}
                    className="hidden"
                  />
                  <div className="font-semibold text-white text-sm">{svc.name}</div>
                  <div className="text-xs text-gray-400">${svc.basePrice} • {svc.duration}m</div>
                </label>
              ))}
            </div>
          </div>

          {/* Add-Ons Section */}
          {selectedBase && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-950 rounded-lg border-2 border-gray-700">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Add-Ons</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 sm:gap-2 mb-4">
                {/* Removal */}
                <label
                  className={`p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition text-center text-xs sm:text-sm ${
                    hasRemoval
                      ? 'border-gray-400 bg-gray-800'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={hasRemoval}
                    onChange={(e) => setHasRemoval(e.target.checked)}
                    className="hidden"
                  />
                  <div className="font-semibold text-white text-sm">Removal Service</div>
                  <div className="text-xs text-gray-400">${REMOVAL_SERVICE.price} • {REMOVAL_SERVICE.duration}m</div>
                </label>

                {/* Nail Art */}
                <label
                  className={`p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition text-center text-xs sm:text-sm ${
                    hasNailArt
                      ? 'border-gray-400 bg-gray-800'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={hasNailArt}
                    onChange={(e) => setHasNailArt(e.target.checked)}
                    className="hidden"
                  />
                  <div className="font-semibold text-white text-sm">Nail Art</div>
                  <div className="text-xs text-gray-400">$2-5 per Nail{(baseService?.type === 'acrylic' || baseService?.type === 'rebase') && ' • 60m'}</div>
                </label>

                {/* Design */}
                <label
                  className={`p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition text-center text-xs sm:text-sm ${
                    selectedDesign !== ''
                      ? 'border-gray-400 bg-gray-800'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDesign !== ''}
                    onChange={(e) => setSelectedDesign(e.target.checked ? NAIL_DESIGN[0].id : '')}
                    className="hidden"
                  />
                  <div className="font-semibold text-white text-sm">Ombre or French</div>
                  <div className="text-xs text-gray-400">${NAIL_DESIGN[0]?.price || 15}{(baseService?.type === 'acrylic' || baseService?.type === 'rebase') && ' • 60m'}</div>
                </label>
              </div>

              {/* Nail Art Details */}
              {hasNailArt && (
                <div className="bg-gray-950 p-3 rounded-lg border-2 border-gray-700 space-y-3">
                  <div>
                    <label className="block">
                      <span className="text-white font-semibold mb-2 block text-sm">Price per Nail</span>
                      <input
                        type="number"
                        step="0.50"
                        value={nailArtPrice}
                        onChange={(e) => setNailArtPrice(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-gray-400 text-white bg-gray-900 text-sm"
                        placeholder="e.g., 3.50"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block">
                      <span className="text-white font-semibold mb-2 block text-sm">Design Notes (Optional)</span>
                      <textarea
                        value={nailArtNotes}
                        onChange={(e) => setNailArtNotes(e.target.value)}
                        rows={3}
                        placeholder="Describe your nail art ideas..."
                        className="w-full p-2 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-gray-400 text-white bg-gray-900 text-sm"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Calendar Section */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Select New Date</h2>
            <Calendar 
              selectedDate={selectedDate} 
              onDateSelect={setSelectedDate}
              availableTimeSlotsMap={availableTimeSlotsMap}
              duration={totalDuration}
            />
          </div>

          {/* Time Selection */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Select New Time</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {DISPLAY_TIMES.map((time) => {
                const timeSlotsForDate = availableTimeSlotsMap[selectedDate];
                const hasSlots = hasEnoughConsecutiveSlots(time, totalDuration, timeSlotsForDate || []);
                const isSelected = selectedTime === time;

                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => hasSlots && setSelectedTime(time)}
                    disabled={!hasSlots}
                    className={`p-2 rounded-lg font-semibold text-xs sm:text-sm transition ${
                      isSelected
                        ? 'bg-pink-600 text-white border-2 border-pink-500'
                        : hasSlots
                        ? 'bg-gray-800 text-white border-2 border-gray-700 hover:border-gray-500 hover:bg-gray-700 cursor-pointer'
                        : 'bg-gray-900 text-gray-600 border-2 border-gray-900 cursor-not-allowed'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Summary */}
          <div className="mb-6 p-4 bg-gray-950 rounded-lg border-2 border-gray-700">
            <div className="flex justify-between items-center text-white">
              <span className="font-semibold">Estimated Total:</span>
              <span className="text-xl font-bold text-pink-500">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="text-xs text-gray-400 mt-2">Duration: {totalDuration} minutes</div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 flex-col sm:flex-row">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedDate || !selectedTime}
              className="flex-1 px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                  Saving...
                </>
              ) : (
                'Confirm Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-8 border-2 border-gray-700">
            <h3 className="text-2xl font-bold text-red-500 mb-4">Cancel Appointment?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to cancel this appointment? This action cannot be undone, and Kinsey will be notified.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
