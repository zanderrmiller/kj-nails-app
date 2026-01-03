'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NavMenu from '@/components/NavMenu';

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
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM',
];

// Display times for the booking page (only show up to 6:00 PM)
const DISPLAY_TIMES = [
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

// Helper function to calculate end time from start time and duration
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const AVAILABLE_TIMES = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
    '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM',
  ];
  
  const startIndex = AVAILABLE_TIMES.indexOf(startTime);
  if (startIndex === -1) return startTime;
  
  // Calculate slots needed (each slot is 30 minutes)
  const slotsNeeded = Math.ceil(durationMinutes / 30);
  const endIndex = Math.min(startIndex + slotsNeeded, AVAILABLE_TIMES.length - 1);
  
  return AVAILABLE_TIMES[endIndex];
}

// Helper function to check if there are enough consecutive available slots for a duration
function hasEnoughConsecutiveSlots(
  startTime: string,
  durationMinutes: number,
  timeSlotsForDate: Array<{ time: string; available: boolean; reason: string | null }>
): boolean {
  const AVAILABLE_TIMES = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
    '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM',
  ];
  
  const startIndex = AVAILABLE_TIMES.indexOf(startTime);
  if (startIndex === -1) return false;
  
  // Calculate how many slots are needed for this duration
  const slotsNeeded = Math.ceil(durationMinutes / 30);
  
  // Check if all required slots are available
  for (let i = 0; i < slotsNeeded; i++) {
    const slotIndex = startIndex + i;
    if (slotIndex >= AVAILABLE_TIMES.length) return false; // Past end of day
    
    const slotTime = AVAILABLE_TIMES[slotIndex];
    const slot = timeSlotsForDate.find((s) => s.time === slotTime);
    if (!slot || !slot.available) return false;
  }
  
  return true;
}

// Helper function to format date as "Month Day"
function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

// Calendar component - shows 60 days from today with month navigation
function Calendar({ 
  selectedDate, 
  onDateSelect, 
  availableTimeSlotsMap,
  duration = 0,
  hasEnoughSlots
}: { 
  selectedDate: string; 
  onDateSelect: (date: string) => void; 
  availableTimeSlotsMap: { [date: string]: Array<{ time: string; available: boolean; reason: string | null }> };
  duration?: number;
  hasEnoughSlots?: (time: string, duration: number, slots: Array<{ time: string; available: boolean; reason: string | null }>) => boolean;
}) {
  const [displayMonth, setDisplayMonth] = useState(0); // 0 = current month, 1 = next month, 2 = month after, etc.
  
  // Use DISPLAY_TIMES for calendar validation since that's what users see
  const TIMES_TO_CHECK = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
    '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM',
  ];

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
    <div className="bg-black p-4 rounded-lg border-2 border-gray-700">
      {/* Month Navigation */}
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
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-semibold text-gray-400 text-sm">
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
          
          // Check if this date has any available time slots (checking only DISPLAY_TIMES)
          const timeSlotsForDate = availableTimeSlotsMap[dateString];
          const hasAvailableTimes = timeSlotsForDate ? timeSlotsForDate.some((slot) => slot.available && DISPLAY_TIMES.includes(slot.time)) : isWithin60Days;
          
          // If duration is specified, check if there's at least one time slot that can fit it (checking only DISPLAY_TIMES)
          let hasValidSlotForDuration = true;
          if (duration > 0 && timeSlotsForDate && hasEnoughSlots) {
            hasValidSlotForDuration = TIMES_TO_CHECK.some(time => 
              hasEnoughSlots(time, duration, timeSlotsForDate)
            );
          }
          
          const canBook = isWithin60Days && hasAvailableTimes && hasValidSlotForDuration;
          
          return (
            <button
              key={day}
              type="button"
              onClick={() => canBook && onDateSelect(dateString)}
              disabled={!canBook}
              className={`p-2 rounded-lg font-semibold text-sm transition w-full h-full flex items-center justify-center ${
                isSelected
                  ? 'bg-gray-700 text-white border-2 border-gray-600'
                  : canBook
                  ? 'bg-black text-white border-2 border-gray-700 hover:border-gray-500 hover:bg-gray-800 cursor-pointer'
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

  // Function to fetch availability
  const fetchAvailability = async () => {
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

  // Preload all 60 days of availability on mount (single API call instead of 60)
  useEffect(() => {
    fetchAvailability();
  }, []);

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [nailArtPrice, setNailArtPrice] = useState(0);
  const [nailArtImages, setNailArtImages] = useState<File[]>([]);
  const [nailArtNotes, setNailArtNotes] = useState('');

  // Modal state
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{
    name: string;
    phone: string;
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    service: string;
    addons: string[];
  } | null>(null);

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
      setModalTitle('Missing Information');
      setModalMessage('Please fill in all required fields');
      setIsSuccess(false);
      setShowModal(true);
      return;
    }

    if (!smsConsent) {
      setModalTitle('Consent Required');
      setModalMessage('Please consent to receive text message updates to book your appointment');
      setIsSuccess(false);
      setShowModal(true);
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
        const endTime = calculateEndTime(selectedTime, totalDuration);
        const formattedDate = formatDateForDisplay(selectedDate);
        
        // Build add-ons list for display
        const addonsDisplay: string[] = [];
        if (hasRemoval) addonsDisplay.push('Removal');
        if (hasNailArt) addonsDisplay.push('Nail Art');
        if (selectedDesign) {
          const design = NAIL_DESIGN.find(d => d.id === selectedDesign);
          if (design) addonsDisplay.push(design.name);
        }
        
        setModalTitle('Booking Request Sent');
        setModalMessage('Your appointment request has been submitted. Thank you for booking with me!');
        setBookingDetails({
          name: customerName,
          phone: customerPhone,
          date: formattedDate,
          startTime: selectedTime,
          endTime: endTime,
          duration: totalDuration,
          service: baseService?.name || '',
          addons: addonsDisplay,
        });
        setIsSuccess(true);
        setShowModal(true);
        
        // Refetch availability after successful booking
        await fetchAvailability();
        
        // Reset form
        setHasRemoval(false);
        setSelectedBase('');
        setHasNailArt(false);
        setSelectedDesign('');
        setSelectedDate('');
        setSelectedTime('');
        setCustomerName('');
        setCustomerPhone('');
        setSmsConsent(false);
        setNailArtPrice(0);
        setNailArtImages([]);
        setNailArtNotes('');
      } else {
        setModalTitle('Booking Failed');
        setModalMessage(data.error || 'Failed to book appointment. Please try again.');
        setIsSuccess(false);
        setBookingDetails(null);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Booking error:', error);
      setModalTitle('Error');
      setModalMessage('An error occurred while booking. Please try again.');
      setIsSuccess(false);
      setBookingDetails(null);
      setShowModal(true);
    }
  };

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

      {/* Booking Form */}
      <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6 sm:mb-8 text-center">Book Your Appointment</h1>

        <form onSubmit={handleSubmit} className="rounded-xl overflow-hidden shadow-xl p-4 sm:p-8" style={{
          backgroundImage: `url('/images/white-marble-texture.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#f5f5f0'
        }}>
          {/* Service Selection */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-black mb-2 sm:mb-3">Select Your Nail Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 sm:gap-2">
              {BASE_SERVICES.map((svc) => (
                <label
                  key={svc.id}
                  className={`p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition text-center text-xs sm:text-sm ${
                    selectedBase === svc.id
                      ? 'border-gray-500 bg-gray-700'
                      : 'border-gray-700 hover:border-gray-500 bg-gray-950'
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
                  <div className="text-xs text-gray-300">${svc.basePrice} • {svc.duration}m</div>
                </label>
              ))}
            </div>
          </div>

          {/* Add-Ons Section (shown when base service selected) */}
          {selectedBase && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border-2 border-gray-700" style={{
              backgroundColor: 'rgba(30,30,30,0.9)',
              backgroundImage: `url('/images/white-marble-texture.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundBlendMode: 'overlay'
            }}>
              <h2 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Add-Ons</h2>

              {/* Add-Ons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 sm:gap-2 mb-4">
                {/* Removal Add-On */}
                <label
                  className={`p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition text-center text-xs sm:text-sm ${
                    hasRemoval
                      ? 'border-gray-500 bg-gray-700'
                      : 'border-gray-700 hover:border-gray-500 bg-gray-950'
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

                {/* Nail Art Add-On */}
                <label
                  className={`p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition text-center text-xs sm:text-sm ${
                    hasNailArt
                      ? 'border-gray-500 bg-gray-700'
                      : 'border-gray-700 hover:border-gray-500 bg-gray-950'
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
                  <div className="font-semibold text-white text-sm">Nail Art</div>
                  <div className="text-xs text-gray-400">$2-5 per Nail{(baseService?.type === 'acrylic' || baseService?.type === 'rebase') && ' • 60m'}</div>
                </label>

                {/* Ombre or French Add-On */}
                <label
                  className={`p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition text-center text-xs sm:text-sm ${
                    selectedDesign !== ''
                      ? 'border-gray-500 bg-gray-700'
                      : 'border-gray-700 hover:border-gray-500 bg-gray-950'
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

              {/* Nail Art Details (shown when selected) */}
              {hasNailArt && (
                <div className="bg-gray-950 p-3 rounded-lg border-2 border-gray-700 space-y-3">
                  <div>
                    <label className="block">
                      <span className="text-white font-semibold mb-2 block text-sm">Upload Inspiration Pictures</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => setNailArtImages(Array.from(e.target.files || []))}
                        className="w-full p-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:border-gray-600 text-sm text-gray-600 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gray-300 file:text-gray-900 hover:file:bg-gray-200"
                      />
                      {nailArtImages.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {nailArtImages.map((file, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${idx + 1}`}
                                className="w-full h-20 object-cover rounded border-2 border-gray-400"
                              />
                              <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
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
                      <span className="text-white font-semibold mb-2 block text-sm">Nail Art Notes</span>
                      <textarea
                        value={nailArtNotes}
                        onChange={(e) => setNailArtNotes(e.target.value)}
                        placeholder="Describe your nail art design, style preferences, colors, patterns, or any special requests..."
                        className="w-full p-2 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-gray-400 text-sm resize-none text-white bg-gray-800"
                        rows={4}
                      />
                    </label>
                  </div>

                  <div className="bg-gray-800 border-l-4 border-gray-600 p-2">
                    <p className="text-xs text-gray-300">
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
              <h2 className="text-lg sm:text-2xl font-semibold text-black mb-3 sm:mb-4">Select Date</h2>
              <Calendar 
                selectedDate={selectedDate} 
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTime('');
                }} 
                availableTimeSlotsMap={availableTimeSlotsMap}
                duration={totalDuration}
                hasEnoughSlots={hasEnoughConsecutiveSlots}
              />
              <p className="text-xs sm:text-sm text-gray-400 mt-2 sm:mt-3">Available for the next 60 days</p>
            </div>
          )}

          {/* Time Selection */}
          {selectedBase && selectedDate && (
            <div className="mb-4 sm:mb-8">
              <h2 className="text-lg sm:text-2xl font-semibold text-black mb-3 sm:mb-4">Select Time</h2>
              {timeSlotsLoading ? (
                <div className="text-center py-4">
                  <p className="text-xs sm:text-sm text-gray-400">Loading available times...</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2">
                  {(availableTimeSlotsMap[selectedDate] || AVAILABLE_TIMES.map((t) => ({ time: t, available: true, reason: null })))
                    .filter((slot) => DISPLAY_TIMES.includes(slot.time))
                    .map((slot) => {
                    // Use the full unfiltered time slots for checking consecutive availability
                    const fullTimeSlotsForDate = availableTimeSlotsMap[selectedDate] || AVAILABLE_TIMES.map((t) => ({ time: t, available: true, reason: null }));
                    const canBook = slot.available && hasEnoughConsecutiveSlots(slot.time, totalDuration, fullTimeSlotsForDate);
                    const isDisabled = !canBook;
                    const disabledReason = !slot.available ? slot.reason : !canBook ? `Not enough consecutive time for ${totalDuration} min appointment` : null;
                    
                    return (
                      <div key={slot.time} className="relative group">
                        <label
                          className={`p-2 md:p-3 border-2 rounded-lg text-center text-sm md:text-base transition block ${
                            isDisabled
                              ? 'border-gray-600 bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                              : selectedTime === slot.time
                              ? 'border-gray-400 bg-gray-700 text-white cursor-pointer'
                              : 'bg-black border-gray-600 text-white hover:border-gray-400 hover:bg-gray-800 cursor-pointer'
                          }`}
                        >
                          <input
                            type="radio"
                            name="time"
                            value={slot.time}
                            checked={selectedTime === slot.time}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            disabled={isDisabled}
                            className="hidden"
                          />
                          {slot.time}
                        </label>
                        {isDisabled && disabledReason && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap mb-2 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                            {disabledReason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Customer Info */}
          {selectedBase && selectedDate && selectedTime && (
            <div className="mb-4 sm:mb-8">
              <h2 className="text-lg sm:text-2xl font-semibold text-black mb-3 sm:mb-4">Your Information</h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-gray-900 font-semibold mb-2">Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your name"
                    className="w-full p-3 border-2 border-gray-400 rounded-lg focus:outline-none focus:border-gray-600 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-900 font-semibold mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(formatPhoneNumber(e.target.value))}
                    placeholder="(555) 123-4567"
                    className="w-full p-3 border-2 border-gray-400 rounded-lg focus:outline-none focus:border-gray-600 text-gray-900 bg-white"
                  />
                </div>

                {/* SMS Consent */}
                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="smsConsent"
                    checked={smsConsent}
                    onChange={(e) => setSmsConsent(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-gray-800 border-gray-600 rounded focus:ring-gray-800 cursor-pointer"
                  />
                  <label htmlFor="smsConsent" className="text-sm text-gray-600 cursor-pointer font-medium">
                    I agree to receive text messages from KJNails in regards to appointment scheduling, confirmation, and feedback. *
                  </label>
                </div>

              </div>
            </div>
          )}

          {/* Summary */}
          {selectedBase && selectedDate && selectedTime && (
            <div className="mb-8 p-6 bg-gray-900 rounded-lg border-2 border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Appointment Summary</h3>
              <div className="space-y-2 text-gray-300">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span className="font-semibold text-white">{baseService?.name}</span>
                </div>
                {hasRemoval && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">+ Removal</span>
                    <span className="font-semibold text-gray-300">${REMOVAL_SERVICE.price}</span>
                  </div>
                )}
                {hasNailArt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">+ Nail Art</span>
                    <span className="font-semibold text-gray-300">${nailArtPrice.toFixed(2)}</span>
                  </div>
                )}
                {selectedDesign && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">+ {NAIL_DESIGN.find((d) => d.id === selectedDesign)?.name}</span>
                    <span className="font-semibold text-gray-300">${NAIL_DESIGN.find((d) => d.id === selectedDesign)?.price}</span>
                  </div>
                )}
                <div className="flex justify-between pt-4 border-t border-gray-700">
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
                <div className="flex justify-between pt-4 border-t-2 border-gray-700 text-lg font-bold text-white">
                  <span>Total Price:</span>
                  <span className="text-gray-300">${totalPrice.toFixed(2)}{hasNailArt && '+'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {selectedBase && selectedDate && selectedTime && (
            <button
              type="submit"
              disabled={!customerName || !customerPhone || !smsConsent}
              className={`w-full py-4 rounded-lg font-bold text-lg transition ${
                customerName && customerPhone && smsConsent
                  ? 'bg-white text-black hover:bg-gray-200 cursor-pointer'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {customerName && customerPhone && smsConsent 
                ? 'Confirm Booking' 
                : customerName && customerPhone
                  ? 'Check SMS Consent to Continue'
                  : 'Enter Your Name & Phone to Continue'}
            </button>
          )}
        </form>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-black rounded-lg shadow-lg p-8 max-w-md w-full max-h-[80vh] flex flex-col overflow-y-auto border-2 border-gray-700">
            <h2 className={`text-2xl font-bold mb-4 ${isSuccess ? 'text-white' : 'text-red-400'}`}>
              {modalTitle}
            </h2>
            <p className="text-gray-300 text-base mb-6 leading-relaxed">
              {modalMessage}
            </p>
            
            {/* Booking Details for Success */}
            {isSuccess && bookingDetails && (
              <div className="space-y-4 mb-6">
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">Name</p>
                    <p className="text-white font-semibold text-lg">{bookingDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Phone Number</p>
                    <p className="text-white font-semibold text-lg">{bookingDetails.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Appointment Time</p>
                    <p className="text-white font-semibold text-lg">
                      {bookingDetails.date} • {bookingDetails.startTime} - {bookingDetails.endTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Service</p>
                    <p className="text-white font-semibold text-lg">{bookingDetails.service}</p>
                  </div>
                  {bookingDetails.addons.length > 0 && (
                    <div>
                      <p className="text-gray-400 text-sm">Add-Ons</p>
                      <p className="text-white font-semibold text-lg">{bookingDetails.addons.join(', ')}</p>
                    </div>
                  )}
                </div>
                
                {/* Disclaimer */}
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    <span className="underline font-semibold">Note</span>: You will receive a text once your appointment is confirmed with Kinsey, along with a rescheduling link if needed.
                  </p>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 rounded-lg font-bold text-lg bg-white text-black hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
