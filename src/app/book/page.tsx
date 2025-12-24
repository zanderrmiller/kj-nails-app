'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Base service options
const BASE_SERVICES = [
  { id: 'acrylic-short', name: 'Acrylic Sets - Short', duration: 120, basePrice: 50, type: 'acrylic' },
  { id: 'acrylic-long', name: 'Acrylic Sets - Long', duration: 150, basePrice: 60, type: 'acrylic' },
  { id: 'gel', name: 'Gel Manicure', duration: 60, basePrice: 35, type: 'gel' },
  { id: 'rebase', name: 'Rebase', duration: 60, basePrice: 40, type: 'rebase' },
];

// Optional removal service (prepended)
const REMOVAL_SERVICE = {
  id: 'removal',
  name: 'Removal',
  duration: 45,
  price: 20,
};

// Optional add-ons
const NAIL_ART = {
  id: 'nail-art',
  name: 'Nail Art',
  price: 'Variable',
  durationAdd: 60, // adds 1 hour to acrylic, nothing to gel
};

const NAIL_DESIGN = [
  { id: 'ombre', name: 'Ombre', price: 15, durationAdd: 60 }, // adds 1 hour to acrylic, nothing to gel
  { id: 'french', name: 'French', price: 15, durationAdd: 60 },
];

const AVAILABLE_TIMES = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM',
];

// Helper function to format date as "Month, Day"
function formatDateMonthDay(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[date.getMonth()]}, ${date.getDate()}`;
}

// Helper function to convert 12-hour time to minutes
function timeToMinutes(time: string): number {
  const [timePart, period] = time.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return hours * 60 + minutes;
}

// Helper function to convert minutes to 12-hour time
function minutesToTime(mins: number): string {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  
  let displayHours = hours;
  let period = 'AM';
  
  if (hours >= 12) {
    period = 'PM';
    if (hours > 12) displayHours = hours - 12;
  }
  if (hours === 0) displayHours = 12;
  
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

// Helper function to format phone number for Twilio (+1 XXX XXX XXXX - with spaces to match verified list)
function formatPhoneForTwilio(phoneNumber: string): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // If only 10 digits, add +1 country code and format with spaces
  if (digits.length === 10) {
    return `+1 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  
  // If 11 digits starting with 1, format with spaces
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits.slice(0, 1)} ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  
  // Already formatted, return as-is
  return phoneNumber;
}

// Helper function to format phone number as (xxx) xxx-xxxx
function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const truncated = digits.slice(0, 10);
  
  // Format as (xxx) xxx-xxxx
  if (truncated.length === 0) return '';
  if (truncated.length <= 3) return `(${truncated}`;
  if (truncated.length <= 6) return `(${truncated.slice(0, 3)}) ${truncated.slice(3)}`;
  return `(${truncated.slice(0, 3)}) ${truncated.slice(3, 6)}-${truncated.slice(6)}`;
}

// Calendar component - shows 60 days from today with month navigation
function Calendar({ selectedDate, onDateSelect, availableTimeSlotsMap }: { selectedDate: string; onDateSelect: (date: string) => void; availableTimeSlotsMap: { [date: string]: Array<{ time: string; available: boolean; reason: string | null }> } }) {
  const [displayMonth, setDisplayMonth] = useState(0); // 0 = current month, 1 = next month, 2 = month after, etc.

  const now = new Date();
  const startDate = new Date(now);
  
  // Generate 60 days of available dates
  const availableDates = new Set<string>();
  for (let i = 0; i < 60; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    availableDates.add(dateString);
  }

  // Show the month based on displayMonth offset
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

  // Check if we can navigate to previous month (limit to current month)
  const canGoPrev = displayMonth > 0;
  // Check if we can navigate to next month (limit to 2 months ahead for 60-day window)
  const canGoNext = displayMonth < 2;

  return (
    <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setDisplayMonth(displayMonth - 1)}
          disabled={!canGoPrev}
          className={`px-2 py-1 text-lg font-bold transition ${
            canGoPrev
              ? 'text-pink-600 hover:text-pink-700 cursor-pointer'
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          &lt;
        </button>
        <h3 className="text-lg font-semibold text-gray-900 flex-1 text-center">{monthName}</h3>
        <button
          type="button"
          onClick={() => setDisplayMonth(displayMonth + 1)}
          disabled={!canGoNext}
          className={`px-2 py-1 text-lg font-bold transition ${
            canGoNext
              ? 'text-pink-600 hover:text-pink-700 cursor-pointer'
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          &gt;
        </button>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-semibold text-gray-600 text-sm">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} />;
          }
          
          const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isWithin60Days = availableDates.has(dateString);
          const isSelected = selectedDate === dateString;
          
          // Check if this date has any available time slots
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
                  ? 'bg-pink-600 text-white border-2 border-pink-600'
                  : canBook
                  ? 'bg-white text-gray-900 border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50 cursor-pointer'
                  : 'bg-gray-100 text-gray-400 border-2 border-gray-100 cursor-not-allowed'
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

export default function BookPage() {
  // Time slots state
  const [availableTimeSlotsMap, setAvailableTimeSlotsMap] = useState<{ [date: string]: Array<{ time: string; available: boolean; reason: string | null }> }>({});
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);

  // Step 1: Removal (optional)
  const [hasRemoval, setHasRemoval] = useState(false);

  // Step 2: Base service selection (required)
  const [selectedBase, setSelectedBase] = useState('');

  // Step 3: Nail art (optional)
  const [hasNailArt, setHasNailArt] = useState(false);

  // Step 4: Ombre or French (optional)
  const [selectedDesign, setSelectedDesign] = useState('');

  // Step 5: Date
  const [selectedDate, setSelectedDate] = useState('');

  // Step 6: Time
  const [selectedTime, setSelectedTime] = useState('');

  // Preload all 60 days of availability on mount (single API call instead of 60)
  useEffect(() => {
    const fetchAllTimeSlots = async () => {
      try {
        // Add cache busting parameter to force fresh data
        const response = await fetch(`/api/availability-60-days?t=${Date.now()}`);
        const data = await response.json();

        if (data.success && data.dates) {
          setAvailableTimeSlotsMap(data.dates);
        }
      } catch (error) {
        console.error('Failed to fetch 60-day availability:', error);
      }
    };

    fetchAllTimeSlots();
  }, []);

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [nailArtPrice, setNailArtPrice] = useState(0);
  const [nailArtImages, setNailArtImages] = useState<File[]>([]);
  const [nailArtNotes, setNailArtNotes] = useState('');

  // Calculate totals
  const baseService = BASE_SERVICES.find((s) => s.id === selectedBase);

  let totalDuration = baseService?.duration || 0;
  let totalPrice = baseService?.basePrice || 0;

  // Add removal if selected
  if (hasRemoval) {
    totalDuration += REMOVAL_SERVICE.duration;
    totalPrice += REMOVAL_SERVICE.price;
  }

  // Handle nail art and design duration logic
  if (baseService) {
    if (hasNailArt) {
      totalPrice += nailArtPrice;
      if (baseService.type === 'acrylic' || baseService.type === 'rebase') {
        // Nail art adds 1 hour to acrylic and rebase
        totalDuration += NAIL_ART.durationAdd;
      }
      // Gel doesn't get time added for nail art
    }

    if (selectedDesign) {
      const design = NAIL_DESIGN.find((d) => d.id === selectedDesign);
      if (design) {
        totalPrice += design.price;
        if (baseService.type === 'acrylic' || baseService.type === 'rebase') {
          // If both nail art and design selected, only add 1 hour total
          if (hasNailArt) {
            // Already added 1 hour for nail art, don't add more
          } else {
            // Only design, add 1 hour
            totalDuration += design.durationAdd;
          }
        }
        // Gel doesn't get time added for design
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBase || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      alert('Please fill in all required fields');
      return;
    }

    // Build addons array
    const addons = [];
    
    if (hasRemoval) {
      addons.push(REMOVAL_SERVICE);
    }
    
    if (hasNailArt) {
      addons.push({
        ...NAIL_ART,
        price: nailArtPrice,
      });
    }
    
    if (selectedDesign) {
      const design = NAIL_DESIGN.find((d) => d.id === selectedDesign);
      if (design) {
        addons.push(design);
      }
    }

    const baseService = BASE_SERVICES.find((s) => s.id === selectedBase);
    if (!baseService) {
      alert('Invalid service selected');
      return;
    }

    try {
      let nailArtImageUrls: string[] = [];

      // Step 1: Upload nail art images if any exist
      if (nailArtImages.length > 0) {
        try {
          const formData = new FormData();
          nailArtImages.forEach((file) => {
            formData.append('files', file);
          });
          // Use a temporary ID for now - will be replaced with actual booking ID after booking is created
          formData.append('bookingId', `temp-${Date.now()}`);

          const uploadResponse = await fetch('/api/upload-nail-art', {
            method: 'POST',
            body: formData,
          });

          const uploadData = await uploadResponse.json();

          if (!uploadResponse.ok) {
            console.error('Image upload failed:', uploadData.error);
            // Continue anyway, don't block booking just because images failed
          } else {
            nailArtImageUrls = uploadData.urls || [];
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          // Continue with booking even if image upload fails
        }
      }

      // Step 2: Create the booking
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseService,
          addons,
          date: selectedDate,
          time: selectedTime,
          customerName,
          customerPhone: formatPhoneForTwilio(customerPhone),
          totalPrice,
          totalDuration,
          nailArtNotes,
          nailArtImagesCount: nailArtImages.length,
          nailArtImageUrls,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Appointment booked! You will receive a confirmation text soon.');
        // Reset form
        setHasRemoval(false);
        setSelectedBase('');
        setHasNailArt(false);
        setSelectedDesign('');
        setSelectedDate('');
        setSelectedTime('');
        setCustomerName('');
        setCustomerPhone('');
        setNailArtPrice(0);
        setNailArtImages([]);
        setNailArtNotes('');
      } else {
        alert(data.error || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('An error occurred while booking. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-3xl font-bold text-pink-600">
              KJ Nails
            </Link>
            <Link href="/" className="text-gray-600 hover:text-pink-600">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Booking Form */}
      <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">Book Your Appointment</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
          {/* Service Selection */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Select Your Nail Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 sm:gap-2">
              {BASE_SERVICES.map((svc) => (
                <label
                  key={svc.id}
                  className={`p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition text-center text-xs sm:text-sm ${
                    selectedBase === svc.id
                      ? 'border-pink-600 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
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
                  <div className="font-semibold text-gray-900 text-sm">{svc.name}</div>
                  <div className="text-xs text-gray-600">${svc.basePrice} • {svc.duration}m</div>
                </label>
              ))}
            </div>
          </div>

          {/* Add-Ons Section (shown when base service selected) */}
          {selectedBase && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-b from-pink-50 to-white rounded-lg border-2 border-pink-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Add-Ons</h2>

              {/* Add-Ons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 sm:gap-2 mb-4">
                {/* Removal Add-On */}
                <label
                  className={`p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition text-center text-xs sm:text-sm ${
                    hasRemoval
                      ? 'border-pink-600 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={hasRemoval}
                    onChange={(e) => setHasRemoval(e.target.checked)}
                    className="hidden"
                  />
                  <div className="font-semibold text-gray-900 text-sm">Removal Service</div>
                  <div className="text-xs text-gray-600">${REMOVAL_SERVICE.price} • {REMOVAL_SERVICE.duration}m</div>
                </label>

                {/* Nail Art Add-On */}
                <label
                  className={`p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition text-center text-xs sm:text-sm ${
                    hasNailArt
                      ? 'border-pink-600 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={hasNailArt}
                    onChange={(e) => {
                      setHasNailArt(e.target.checked);
                      if (!e.target.checked) {
                        setNailArtImages([]);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="font-semibold text-gray-900 text-sm">Nail Art</div>
                  <div className="text-xs text-gray-600">$2-5 per Nail{(baseService?.type === 'acrylic' || baseService?.type === 'rebase') && ' • 60m'}</div>
                </label>

                {/* Ombre or French Add-On */}
                <label
                  className={`p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition text-center text-xs sm:text-sm ${
                    selectedDesign !== ''
                      ? 'border-pink-600 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDesign !== ''}
                    onChange={(e) => setSelectedDesign(e.target.checked ? NAIL_DESIGN[0].id : '')}
                    className="hidden"
                  />
                  <div className="font-semibold text-gray-900 text-sm">Ombre or French</div>
                  <div className="text-xs text-gray-600">${NAIL_DESIGN[0]?.price || 15}{(baseService?.type === 'acrylic' || baseService?.type === 'rebase') && ' • 60m'}</div>
                </label>
              </div>

              {/* Nail Art Details (shown when selected) */}
              {hasNailArt && (
                <div className="bg-white p-3 rounded-lg border-2 border-pink-200 space-y-3">
                  <div>
                    <label className="block">
                      <span className="text-gray-700 font-semibold mb-2 block text-sm">Upload Inspiration Pictures</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => setNailArtImages(Array.from(e.target.files || []))}
                        className="w-full p-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-pink-600 text-sm text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-pink-50 file:text-pink-600 hover:file:bg-pink-100"
                      />
                      {nailArtImages.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {nailArtImages.map((file, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${idx + 1}`}
                                className="w-full h-20 object-cover rounded border-2 border-pink-300"
                              />
                              <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                onClick={() => setNailArtImages(nailArtImages.filter((_, i) => i !== idx))}
                              >
                                ✕
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </label>
                  </div>

                  <div>
                    <label className="block">
                      <span className="text-gray-700 font-semibold mb-2 block text-sm">Nail Art Notes</span>
                      <textarea
                        value={nailArtNotes}
                        onChange={(e) => setNailArtNotes(e.target.value)}
                        placeholder="Describe your nail art design, style preferences, colors, patterns, or any special requests..."
                        className="w-full p-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-pink-600 text-sm resize-none text-gray-900"
                        rows={4}
                      />
                    </label>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-400 p-2">
                    <p className="text-xs text-blue-800">
                      <span className="font-semibold">Note:</span> Kinsey will reach out and discuss final pricing.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Date Selection */}
          {selectedBase && (
            <div className="mb-4 sm:mb-8">
              <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Select Date</h2>
              <Calendar selectedDate={selectedDate} onDateSelect={(date) => {
                setSelectedDate(date);
                setSelectedTime('');
              }} availableTimeSlotsMap={availableTimeSlotsMap} />
              <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">Available for the next 60 days</p>
            </div>
          )}

          {/* Time Selection */}
          {selectedBase && selectedDate && (
            <div className="mb-4 sm:mb-8">
              <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Select Time</h2>
              {timeSlotsLoading ? (
                <div className="text-center py-4">
                  <p className="text-xs sm:text-sm text-gray-600">Loading available times...</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2">
                  {(availableTimeSlotsMap[selectedDate] || AVAILABLE_TIMES.map((t) => ({ time: t, available: true, reason: null }))).map((slot) => (
                    <div key={slot.time} className="relative group">
                      <label
                        className={`p-2 md:p-3 border-2 rounded-lg text-center text-sm md:text-base transition block ${
                          !slot.available
                            ? 'border-gray-300 bg-white text-gray-500 cursor-not-allowed opacity-50'
                            : selectedTime === slot.time
                            ? 'border-pink-600 bg-pink-600 text-white cursor-pointer'
                            : 'bg-white border-gray-300 text-gray-900 hover:border-pink-400 hover:bg-pink-50 cursor-pointer'
                        }`}
                      >
                        <input
                          type="radio"
                          name="time"
                          value={slot.time}
                          checked={selectedTime === slot.time}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          disabled={!slot.available}
                          className="hidden"
                        />
                        {slot.time}
                      </label>
                      {!slot.available && slot.reason && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap mb-2 opacity-0 group-hover:opacity-100 transition pointer-events-none">
                          {slot.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Customer Info */}
          {selectedBase && selectedDate && selectedTime && (
            <div className="mb-4 sm:mb-8">
              <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Your Information</h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your name"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-pink-600 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(formatPhoneNumber(e.target.value))}
                    placeholder="(555) 123-4567"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-pink-600 text-gray-900"
                  />
                </div>

              </div>
            </div>
          )}

          {/* Summary */}
          {selectedBase && selectedDate && selectedTime && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Appointment Summary</h3>
              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span className="font-semibold">{baseService?.name}</span>
                </div>
                {hasRemoval && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">+ Removal</span>
                    <span className="font-semibold">${REMOVAL_SERVICE.price}</span>
                  </div>
                )}
                {hasNailArt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">+ Nail Art</span>
                    <span className="font-semibold">${nailArtPrice.toFixed(2)}</span>
                  </div>
                )}
                {selectedDesign && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">+ {NAIL_DESIGN.find((d) => d.id === selectedDesign)?.name}</span>
                    <span className="font-semibold">${NAIL_DESIGN.find((d) => d.id === selectedDesign)?.price}</span>
                  </div>
                )}
                <div className="flex justify-between pt-4 border-t border-gray-300">
                  <span>Duration:</span>
                  <span className="font-semibold">
                    {Math.floor(totalDuration / 60) > 0 && (
                      <>
                        {Math.floor(totalDuration / 60)} {Math.floor(totalDuration / 60) === 1 ? 'Hour' : 'Hours'}
                        {totalDuration % 60 > 0 && ' '}
                      </>
                    )}
                    {totalDuration % 60 > 0 && (
                      <>
                        {totalDuration % 60} {totalDuration % 60 === 1 ? 'Minute' : 'Minutes'}
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span className="font-semibold">
                    {formatDateMonthDay(selectedDate)} {selectedTime} - {minutesToTime(timeToMinutes(selectedTime) + totalDuration)}
                  </span>
                </div>
                <div className="flex justify-between pt-4 border-t-2 border-gray-300 text-lg font-bold">
                  <span>Total Price:</span>
                  <span className="text-pink-600">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {selectedBase && selectedDate && selectedTime && (
            <button
              type="submit"
              disabled={!customerName || !customerPhone}
              className={`w-full py-4 rounded-lg font-bold text-lg transition ${
                customerName && customerPhone
                  ? 'bg-pink-600 text-white hover:bg-pink-700 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {customerName && customerPhone ? 'Confirm Booking' : 'Enter Your Name & Phone to Continue'}
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
