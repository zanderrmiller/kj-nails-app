'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const AVAILABLE_TIMES = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM',
];

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  duration: number;
  total_price: number;
  addons: string[];
  nail_art_notes?: string;
  nail_art_images_count?: number;
  nail_art_image_urls?: string[];
}

// Helper function to convert ID to readable title
function toReadableTitle(id: string): string {
  return id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to convert 24-hour time (HH:MM:SS) to 12-hour format (h:MM AM/PM)
function format24to12Hour(time24: string): string {
  if (!time24) return '';
  
  // Handle formats like "13:00:00" or "13:00"
  const parts = time24.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const period = hours >= 12 ? 'PM' : 'AM';
  
  if (hours > 12) {
    hours -= 12;
  } else if (hours === 0) {
    hours = 12;
  }
  
  return `${hours}:${minutes} ${period}`;
}

// Helper function to calculate end time based on start time and duration
function calculateEndTime(startTime24: string, durationMinutes: number): string {
  if (!startTime24) return '';
  
  const parts = startTime24.split(':');
  let hours = parseInt(parts[0], 10);
  let minutes = parseInt(parts[1], 10);
  
  // Add duration
  minutes += durationMinutes;
  hours += Math.floor(minutes / 60);
  minutes = minutes % 60;
  
  // Convert to 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  let displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
  
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

// Helper function to get grid row for a time slot
function getGridRow(time: string): number {
  const timeIndex = AVAILABLE_TIMES.indexOf(time);
  return timeIndex + 1; // Grid rows start at 1
}

// Helper function to calculate grid span based on duration and start time (includes 15-minute buffer)
function getGridSpan(startTime: string, durationMinutes: number): number {
  // Each time slot is 30 minutes
  // Add 15-minute buffer to duration
  const totalMinutes = durationMinutes + 15;
  return Math.ceil(totalMinutes / 30);
}

// 90-day calendar component
function OperatorCalendar({ bookings, selectedDate, onDateSelect, blockedDates, onUnblockDay }: { bookings: Booking[]; selectedDate: string; onDateSelect: (date: string) => void; blockedDates: Set<string>; onUnblockDay: (date: string) => void }) {
  const [displayMonth, setDisplayMonth] = useState(0);

  const now = new Date();
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
  const canGoNext = displayMonth < 3; // 90 days = ~3 months

  const getDayAppointments = (dateStr: string) => {
    return bookings.filter(b => b.booking_date === dateStr);
  };

  return (
    <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setDisplayMonth(Math.max(0, displayMonth - 1))}
          disabled={!canGoPrev}
          className={`px-2 py-1 text-lg font-bold transition ${
            canGoPrev
              ? 'text-pink-600 hover:text-pink-700 cursor-pointer'
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          ←
        </button>
        <h3 className="text-lg font-semibold text-gray-900 flex-1 text-center">{monthName}</h3>
        <button
          type="button"
          onClick={() => setDisplayMonth(Math.min(3, displayMonth + 1))}
          disabled={!canGoNext}
          className={`px-2 py-1 text-lg font-bold transition ${
            canGoNext
              ? 'text-pink-600 hover:text-pink-700 cursor-pointer'
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-semibold text-gray-600 text-xs h-6">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="min-h-16 sm:min-h-24" />;
          }

          const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayAppointments = getDayAppointments(dateString);
          const isSelected = selectedDate === dateString;
          const isBlocked = blockedDates.has(dateString);
          const hasAppointments = dayAppointments.length > 0;

          return (
            <div
              key={day}
              onClick={() => onDateSelect(dateString)}
              className={`min-h-16 sm:min-h-24 p-1 rounded-lg border-2 transition cursor-pointer flex flex-col items-center justify-center sm:items-start sm:justify-start ${
                isBlocked
                  ? 'border-red-400 bg-red-100'
                  : hasAppointments
                  ? 'border-blue-400 bg-blue-50'
                  : isSelected
                  ? 'border-pink-600 bg-pink-50'
                  : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50'
              }`}
            >
              <div className="flex items-center sm:items-start justify-center sm:justify-between gap-1 w-full">
                <div className="font-semibold text-base sm:text-base text-gray-900">{day}</div>
                {isBlocked && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnblockDay(dateString);
                    }}
                    className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline hidden sm:block"
                  >
                    ✕
                  </button>
                )}
              </div>
              {isBlocked ? (
                <div className="text-xs text-red-700 font-semibold mt-1 hidden sm:block">BLOCKED</div>
              ) : (
                <div className="hidden sm:block text-xs space-y-0.5 mt-1">
                  {dayAppointments.sort((a, b) => a.booking_time.localeCompare(b.booking_time)).slice(0, 2).map((apt) => (
                    <button
                      key={apt.id}
                      type="button"
                      onClick={() => onDateSelect(dateString)}
                      className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-xs truncate block w-full text-left hover:bg-blue-200"
                    >
                      {format24to12Hour(apt.booking_time)} - {calculateEndTime(apt.booking_time, apt.duration)}
                    </button>
                  ))}
                  {dayAppointments.length > 2 && (
                    <button
                      type="button"
                      onClick={() => onDateSelect(dateString)}
                      className="text-gray-600 text-xs hover:underline"
                    >
                      +{dayAppointments.length - 2} more
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Calendar component for edit modal - shows available times per date
function EditCalendar({ selectedDate, onDateSelect, availableTimeSlotsMap, selectedTime, onTimeSelect }: { 
  selectedDate: string; 
  onDateSelect: (date: string) => void; 
  availableTimeSlotsMap: { [date: string]: Array<{ time: string; available: boolean; reason: string | null }> };
  selectedTime: string;
  onTimeSelect: (time: string) => void;
}) {
  const [displayMonth, setDisplayMonth] = useState(0);

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

  const timeSlotsForSelectedDate = selectedDate ? availableTimeSlotsMap[selectedDate] || [] : [];

  return (
    <div className="space-y-4">
      {/* Calendar Grid */}
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

      {/* Time Slots for Selected Date */}
      {selectedDate && timeSlotsForSelectedDate.length > 0 && (
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-3">Available Times</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {timeSlotsForSelectedDate.map((slot) => (
              <button
                key={slot.time}
                type="button"
                onClick={() => slot.available && onTimeSelect(slot.time)}
                disabled={!slot.available}
                title={slot.reason ? `${slot.reason}` : ''}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition ${
                  !slot.available
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : selectedTime === slot.time
                    ? 'bg-pink-600 text-white border-2 border-pink-600'
                    : 'bg-white border-2 border-gray-300 text-gray-900 hover:border-pink-400 hover:bg-pink-50 cursor-pointer'
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'calendar' | 'appointments'>('calendar');
  const [selectedAppointment, setSelectedAppointment] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editTime, setEditTime] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDuration, setEditDuration] = useState(0);
  const [editPrice, setEditPrice] = useState(0);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editService, setEditService] = useState('');
  const [editNailArtNotes, setEditNailArtNotes] = useState('');
  const [editNailArtImageUrls, setEditNailArtImageUrls] = useState<string[]>([]);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [blockedTimes, setBlockedTimes] = useState<Set<string>>(new Set());
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [availableTimeSlotsMap, setAvailableTimeSlotsMap] = useState<{ [date: string]: Array<{ time: string; available: boolean; reason: string | null }> }>({});

  // Load bookings and blocked dates on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsResponse, blockedResponse, availabilityResponse] = await Promise.all([
          fetch('/api/bookings'),
          fetch('/api/blocked-dates'),
          fetch(`/api/availability-60-days?t=${Date.now()}`),
        ]);
        
        const bookingsData = await bookingsResponse.json();
        if (bookingsData.success && bookingsData.bookings) {
          setBookings(bookingsData.bookings);
        }

        const blockedData = await blockedResponse.json();
        if (blockedData.success && blockedData.blockedDates) {
          setBlockedDates(new Set(blockedData.blockedDates));
        }

        const availabilityData = await availabilityResponse.json();
        if (availabilityData.success && availabilityData.dates) {
          setAvailableTimeSlotsMap(availabilityData.dates);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (selectedAppointment || selectedImageUrl || editingBooking) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedAppointment, selectedImageUrl, editingBooking]);

  // Load blocked times for selected date
  useEffect(() => {
    if (!selectedDate) {
      setBlockedTimes(new Set());
      return;
    }

    const fetchBlockedTimes = async () => {
      try {
        const response = await fetch(`/api/blocked-times?date=${selectedDate}`);
        const data = await response.json();

        if (data.success && data.blockedTimes) {
          setBlockedTimes(new Set(data.blockedTimes));
        } else {
          setBlockedTimes(new Set());
        }
      } catch (error) {
        console.error('Failed to fetch blocked times:', error);
      }
    };

    fetchBlockedTimes();
  }, [selectedDate]);

  const dayAppointments = selectedDate ? bookings.filter(b => b.booking_date === selectedDate) : [];

  const blockEntireDay = async () => {
    if (!selectedDate) return;

    try {
      const response = await fetch('/api/block-entire-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      });

      if (response.ok) {
        const newBlocked = new Set(blockedDates);
        newBlocked.add(selectedDate);
        setBlockedDates(newBlocked);
        setBlockedTimes(new Set(AVAILABLE_TIMES));
        setSaveMessage('Entire day blocked');
        setTimeout(() => setSaveMessage(''), 2000);
      }
    } catch (error) {
      console.error('Failed to block entire day:', error);
    }
  };

  const unblockEntireDay = async () => {
    if (!selectedDate) return;

    try {
      const response = await fetch('/api/unblock-entire-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      });

      if (response.ok) {
        const newBlocked = new Set(blockedDates);
        newBlocked.delete(selectedDate);
        setBlockedDates(newBlocked);
        setBlockedTimes(new Set());
        setSaveMessage('Entire day unblocked');
        setTimeout(() => setSaveMessage(''), 2000);
      }
    } catch (error) {
      console.error('Failed to unblock entire day:', error);
    }
  };

  const toggleBlockTime = async (time: string) => {
    if (!selectedDate) return;

    const newBlocked = new Set(blockedTimes);

    if (newBlocked.has(time)) {
      newBlocked.delete(time);
    } else {
      newBlocked.add(time);
    }

    setBlockedTimes(newBlocked);

    try {
      const response = await fetch('/api/blocked-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          time,
          blocked: newBlocked.has(time),
        }),
      });

      if (response.ok) {
        setSaveMessage('Time blocked status updated');
        setTimeout(() => setSaveMessage(''), 2000);
      } else {
        // If update failed, revert the local state
        const reverted = new Set(blockedTimes);
        if (!newBlocked.has(time)) {
          reverted.add(time);
        } else {
          reverted.delete(time);
        }
        setBlockedTimes(reverted);
        setSaveMessage('Failed to update blocked time');
        setTimeout(() => setSaveMessage(''), 2000);
      }
    } catch (error) {
      console.error('Failed to update blocked time:', error);
      // Revert on error
      const reverted = new Set(blockedTimes);
      if (!newBlocked.has(time)) {
        reverted.add(time);
      } else {
        reverted.delete(time);
      }
      setBlockedTimes(reverted);
      setSaveMessage('Error updating blocked time');
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setEditDate(booking.booking_date);
    setEditTime(booking.booking_time);
    setEditDuration(booking.duration);
    setEditPrice(typeof booking.total_price === 'string' ? parseFloat(booking.total_price) : booking.total_price);
    setEditName(booking.customer_name);
    setEditPhone(booking.customer_phone);
    setEditService(booking.service_id);
    setEditNailArtNotes(booking.nail_art_notes || '');
    setEditNailArtImageUrls(booking.nail_art_image_urls || []);
  };

  const handleUploadNailArtImages = async (files: FileList) => {
    if (!editingBooking || files.length === 0) return;

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
      formData.append('bookingId', editingBooking.id);

      const response = await fetch('/api/upload-nail-art', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.urls) {
        // Add new URLs to existing ones
        setEditNailArtImageUrls([...editNailArtImageUrls, ...data.urls]);
      } else {
        alert(data.error || 'Failed to upload images');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred while uploading images');
    }
  };

  const handleSaveBooking = async () => {
    if (!editingBooking) return;

    try {
      // Calculate old and new time slots to manage blocked times
      const oldTime24 = editingBooking.booking_time;
      const oldTimeIndex = AVAILABLE_TIMES.findIndex((t) => format24to12Hour(oldTime24) === t);
      const oldDuration = editingBooking.duration;
      const oldSpan = getGridSpan(format24to12Hour(oldTime24), oldDuration);
      
      const newTime24 = editTime;
      const newTimeIndex = AVAILABLE_TIMES.findIndex((t) => format24to12Hour(newTime24) === t);
      const newSpan = getGridSpan(editTime, editDuration);

      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: editingBooking.id,
          date: editDate,
          time: editTime,
          duration: editDuration,
          total_price: editPrice,
          customer_name: editName,
          customer_phone: editPhone,
          service_id: editService,
          nail_art_notes: editNailArtNotes,
          nail_art_image_urls: editNailArtImageUrls,
        }),
      });

      if (response.ok) {
        // Handle blocked time adjustments
        // If date changed, unblock old date's times
        if (editDate !== editingBooking.booking_date) {
          // Unblock old appointment times on old date
          const updatePromises: Promise<void>[] = [];
          for (let i = 0; i < oldSpan; i++) {
            if (oldTimeIndex + i < AVAILABLE_TIMES.length) {
              const timeToUnblock = AVAILABLE_TIMES[oldTimeIndex + i];
              updatePromises.push(
                fetch('/api/blocked-times', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    date: editingBooking.booking_date,
                    time: timeToUnblock,
                    blocked: false,
                  }),
                }).then(() => undefined).catch((error) => {
                  console.error('Error unblocking old time:', error);
                })
              );
            }
          }
          await Promise.all(updatePromises);
        } else if (editTime !== editingBooking.booking_time || editDuration !== editingBooking.duration) {
          // Same date but time/duration changed - adjust blocked times
          const oldTimeSlots = new Set<string>();
          const newTimeSlots = new Set<string>();
          
          for (let i = 0; i < oldSpan; i++) {
            if (oldTimeIndex + i < AVAILABLE_TIMES.length) {
              oldTimeSlots.add(AVAILABLE_TIMES[oldTimeIndex + i]);
            }
          }
          
          for (let i = 0; i < newSpan; i++) {
            if (newTimeIndex + i < AVAILABLE_TIMES.length) {
              newTimeSlots.add(AVAILABLE_TIMES[newTimeIndex + i]);
            }
          }
          
          // Create promises for all blocked time updates
          const updatePromises: Promise<void>[] = [];
          
          // Unblock times that are no longer needed
          oldTimeSlots.forEach((time) => {
            if (!newTimeSlots.has(time)) {
              updatePromises.push(
                fetch('/api/blocked-times', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    date: editDate,
                    time,
                    blocked: false,
                  }),
                }).then(() => undefined).catch((error) => {
                  console.error('Error unblocking time:', error);
                })
              );
            }
          });
          
          // Block times that are newly needed
          newTimeSlots.forEach((time) => {
            if (!oldTimeSlots.has(time)) {
              updatePromises.push(
                fetch('/api/blocked-times', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    date: editDate,
                    time,
                    blocked: true,
                  }),
                }).then(() => undefined).catch((error) => {
                  console.error('Error blocking time:', error);
                })
              );
            }
          });
          
          // Wait for all blocked time updates to complete
          await Promise.all(updatePromises);
        }

        setBookings(
          bookings.map((b) =>
            b.id === editingBooking.id
              ? { ...b, booking_date: editDate, booking_time: editTime, duration: editDuration, total_price: editPrice, customer_name: editName, customer_phone: editPhone, service_id: editService, nail_art_notes: editNailArtNotes, nail_art_image_urls: editNailArtImageUrls }
              : b
          )
        );
        
        // Update selectedAppointment if it's the same booking being edited
        if (selectedAppointment && selectedAppointment.id === editingBooking.id) {
          setSelectedAppointment({
            ...selectedAppointment,
            booking_date: editDate,
            booking_time: editTime,
            duration: editDuration,
            total_price: editPrice,
            customer_name: editName,
            customer_phone: editPhone,
            service_id: editService,
            nail_art_notes: editNailArtNotes,
            nail_art_image_urls: editNailArtImageUrls,
          });
        }
        
        setEditingBooking(null);
        setSaveMessage('Appointment updated successfully');
        setTimeout(() => setSaveMessage(''), 2000);
        
        // Refresh blocked times and availability for both old and new dates
        const datesToRefresh = new Set([selectedDate, editDate]);
        for (const date of datesToRefresh) {
          if (date) {
            try {
              const refreshResponse = await fetch(`/api/blocked-times?date=${date}`);
              const refreshData = await refreshResponse.json();
              if (refreshData.success && refreshData.blockedTimes && date === selectedDate) {
                setBlockedTimes(new Set(refreshData.blockedTimes));
              }
            } catch (error) {
              console.error(`Error refreshing blocked times for ${date}:`, error);
            }
          }
        }
        
        // Refresh the entire availability map to update the calendar
        try {
          const availabilityResponse = await fetch(`/api/availability-60-days?t=${Date.now()}`);
          const availabilityData = await availabilityResponse.json();
          if (availabilityData.success && availabilityData.dates) {
            setAvailableTimeSlotsMap(availabilityData.dates);
          }
        } catch (error) {
          console.error('Error refreshing availability:', error);
        }
      } else {
        alert('Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('An error occurred while updating the appointment');
    }
  };

  const handleDeleteBooking = async (booking: Booking) => {
    if (!window.confirm(`Delete appointment for ${booking.customer_name} on ${booking.booking_date} at ${booking.booking_time}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings?bookingId=${booking.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = await response.json();

      if (response.ok) {
        setBookings(bookings.filter((b) => b.id !== booking.id));
        setSelectedAppointment(null);
        setSaveMessage('Appointment deleted successfully');
        setTimeout(() => setSaveMessage(''), 2000);
      } else {
        alert(`Failed to delete appointment: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('An error occurred while deleting the appointment');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
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
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
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

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center">Operator Dashboard</h1>

        {saveMessage && (
          <div className="mb-6 p-4 bg-green-100 border-2 border-green-300 text-green-700 rounded-lg text-center">
            {saveMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-2 px-4 font-semibold transition ${
              activeTab === 'calendar'
                ? 'text-pink-600 border-b-2 border-pink-600 -mb-0.5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            90-Day Planner
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-2 px-4 font-semibold transition ${
              activeTab === 'appointments'
                ? 'text-pink-600 border-b-2 border-pink-600 -mb-0.5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Appointments ({bookings.length})
          </button>
        </div>

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div>
            {/* Calendar - Full Width */}
            <div className="mb-8">
              <OperatorCalendar bookings={bookings} selectedDate={selectedDate} onDateSelect={setSelectedDate} blockedDates={blockedDates} onUnblockDay={unblockEntireDay} />
            </div>

            {/* Hour Grid with Appointments */}
            {selectedDate && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4 gap-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h3>
                  
                  <div className="flex gap-2">
                    {!blockedDates.has(selectedDate) && (
                      <button
                        onClick={blockEntireDay}
                        className="py-1 px-3 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition"
                      >
                        Block Entire Day
                      </button>
                    )}
                    {blockedDates.has(selectedDate) && (
                      <button
                        onClick={unblockEntireDay}
                        className="py-1 px-3 text-sm font-semibold text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition"
                      >
                        Unblock Entire Day
                      </button>
                    )}
                  </div>
                </div>

                {/* Hour Grid */}
                <div className="mb-6 border-2 border-gray-300 rounded-lg overflow-hidden">
                  {/* Grid Header and Content */}
                  <div className="grid grid-cols-[120px_1fr] divide-x-2 divide-gray-300 min-h-96">
                    {/* Time Labels Column */}
                    <div className="bg-gray-100 divide-y-2 divide-gray-300">
                      {AVAILABLE_TIMES.map((time) => (
                        <div 
                          key={`time-${time}`} 
                          className="h-16 flex items-center justify-center text-xs font-semibold text-gray-700 bg-gray-50"
                        >
                          {time}
                        </div>
                      ))}
                    </div>

                    {/* Appointment and Block Grid */}
                    <div className="relative bg-white">
                      {/* Background grid lines */}
                      <div className="absolute inset-0 pointer-events-none">
                        {AVAILABLE_TIMES.map((time, idx) => (
                          <div
                            key={`line-${time}`}
                            className="border-b border-gray-200 absolute w-full"
                            style={{
                              top: `${(idx / AVAILABLE_TIMES.length) * 100}%`,
                              height: `${(100 / AVAILABLE_TIMES.length)}%`,
                            }}
                          />
                        ))}
                      </div>

                      {/* Appointments and blocks positioned absolutely */}
                      <div className="relative h-full" style={{ minHeight: `${AVAILABLE_TIMES.length * 64}px` }}>
                        {/* Render Day Blocked first (as background) */}
                        {blockedDates.has(selectedDate) && (
                          <div className="absolute inset-0 bg-red-200 border-2 border-red-400 flex items-center justify-center">
                            <span className="font-bold text-red-800">ENTIRE DAY BLOCKED</span>
                          </div>
                        )}

                        {/* Render Appointments */}
                        {!blockedDates.has(selectedDate) && dayAppointments.map((apt) => {
                          const startIndex = AVAILABLE_TIMES.findIndex(t => format24to12Hour(apt.booking_time) === t);
                          if (startIndex === -1) return null;
                          
                          const span = getGridSpan(format24to12Hour(apt.booking_time), apt.duration);
                          const topPercent = (startIndex / AVAILABLE_TIMES.length) * 100;
                          const heightPercent = (span / AVAILABLE_TIMES.length) * 100;

                          return (
                            <button
                              key={apt.id}
                              onClick={() => setSelectedAppointment(selectedAppointment?.id === apt.id ? null : apt)}
                              className={`absolute left-1 right-1 rounded-lg border-2 p-3 flex items-start justify-between transition overflow-hidden ${
                                selectedAppointment?.id === apt.id
                                  ? 'border-pink-600 bg-pink-200'
                                  : 'border-pink-400 bg-pink-100 hover:bg-pink-150'
                              }`}
                              style={{
                                top: `${topPercent}%`,
                                height: `${heightPercent}%`,
                              }}
                            >
                              {/* Left side - Info */}
                              <div className="flex-1 text-left min-w-0 flex flex-col justify-between">
                                <div>
                                  <div className="font-bold text-pink-900 text-lg leading-tight">{apt.customer_name}</div>
                                  <div className="text-sm text-pink-800 font-semibold leading-tight">{format24to12Hour(apt.booking_time)} - {calculateEndTime(apt.booking_time, apt.duration)}</div>
                                  <div className="text-sm text-pink-700 leading-tight">{toReadableTitle(apt.service_id)}</div>
                                  {apt.addons && apt.addons.length > 0 && (
                                    <div className="text-sm text-pink-700 mt-0.5 leading-tight">
                                      Add Ons: {Array.isArray(apt.addons) ? apt.addons.map(toReadableTitle).join(', ') : apt.addons}
                                    </div>
                                  )}
                                  <div className="text-sm text-pink-700 leading-tight">{apt.customer_phone}</div>
                                </div>
                                <div className="text-sm text-pink-700 leading-tight mt-1">
                                  ${typeof apt.total_price === 'string' ? parseFloat(apt.total_price).toFixed(2) : apt.total_price?.toFixed(2) || '0.00'}
                                </div>
                              </div>

                              {/* Right side - Picture placeholder (hidden on mobile, shows on larger screens) */}
                              <div className="hidden sm:flex ml-2 flex-shrink-0 items-center justify-center w-12 h-12 bg-pink-200 rounded border border-pink-400">
                                <span className="text-xs text-pink-600">📸</span>
                              </div>
                            </button>
                          );
                        })}

                        {/* Render Blocked Times */}
                        {!blockedDates.has(selectedDate) && AVAILABLE_TIMES.map((time, idx) => {
                          const isBlocked = blockedTimes.has(time);
                          const isCoveredByAppointment = dayAppointments.some(apt => {
                            const startIndex = AVAILABLE_TIMES.findIndex(t => format24to12Hour(apt.booking_time) === t);
                            if (startIndex === -1) return false;
                            const span = getGridSpan(format24to12Hour(apt.booking_time), apt.duration);
                            return startIndex <= idx && startIndex + span > idx;
                          });

                          if (isCoveredByAppointment) return null;

                          const topPercent = (idx / AVAILABLE_TIMES.length) * 100;
                          const heightPercent = (100 / AVAILABLE_TIMES.length);

                          return (
                            <button
                              key={`block-${time}`}
                              onClick={() => toggleBlockTime(time)}
                              className={`absolute left-1 right-1 rounded-lg border-2 transition ${
                                isBlocked
                                  ? 'border-red-400 bg-red-100 hover:bg-red-150'
                                  : 'border-gray-400 bg-gray-100 hover:bg-gray-150'
                              }`}
                              style={{
                                top: `${topPercent}%`,
                                height: `${heightPercent}%`,
                              }}
                              title={time}
                            >
                              <span className="text-xs font-semibold text-gray-700">{isBlocked ? '🔒' : ''}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Image Modal Overlay */}
        {selectedImageUrl && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4"
            onClick={() => setSelectedImageUrl(null)}
          >
            <div
              className="relative bg-white rounded-lg shadow-2xl max-w-2xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedImageUrl(null)}
                className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition z-10"
              >
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image */}
              <img
                src={selectedImageUrl}
                alt="Full size nail art"
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            {bookings.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No appointments yet</p>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Appointments</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bookings
                    .sort((a, b) => {
                      const dateTimeA = new Date(`${a.booking_date}T${a.booking_time}`);
                      const dateTimeB = new Date(`${b.booking_date}T${b.booking_time}`);
                      return dateTimeA.getTime() - dateTimeB.getTime();
                    })
                    .map((booking) => (
                      <div
                        key={booking.id}
                        onClick={() => setSelectedAppointment(booking)}
                        className="border-2 border-gray-300 rounded-lg p-4 hover:border-pink-600 hover:shadow-lg hover:bg-pink-50 transition cursor-pointer"
                      >
                        <div className="space-y-2">
                          {/* Name and Phone */}
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Name</p>
                            <div className="flex items-baseline gap-2">
                              <p className="text-base font-bold text-gray-900">{booking.customer_name}</p>
                              <p className="text-xs text-gray-500">{booking.customer_phone}</p>
                            </div>
                          </div>

                          {/* Date & Time */}
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Appointment</p>
                            <p className="text-xs font-semibold text-pink-600">
                              {new Date(`${booking.booking_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {format24to12Hour(booking.booking_time)} - {calculateEndTime(booking.booking_time, booking.duration)}
                            </p>
                          </div>

                          {/* Service and Price */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex-1">
                              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Service</p>
                              <p className="text-xs text-gray-900">{toReadableTitle(booking.service_id)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Price</p>
                              <p className="text-xs font-bold text-green-600">
                                ${typeof booking.total_price === 'string' ? parseFloat(booking.total_price).toFixed(2) : booking.total_price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected Appointment Details Modal - Outside tabs so it shows on both calendar and appointments view */}
        {selectedAppointment && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedAppointment(null)}
          >
            <div 
              className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white border-b-2 border-gray-200 p-6 flex items-center justify-between flex-shrink-0">
                <h4 className="font-bold text-xl text-gray-900">Appointment Details</h4>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-4">
                  {/* Name and Phone - One Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Name</p>
                      <p className="text-sm font-bold text-gray-900">{selectedAppointment.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Phone</p>
                      <p className="text-xs text-gray-900">{selectedAppointment.customer_phone}</p>
                    </div>
                  </div>

                  {/* Service and Price - One Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Service</p>
                      <p className="text-sm text-gray-900">{toReadableTitle(selectedAppointment.service_id)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Price</p>
                      <p className="text-sm font-bold text-green-600">${typeof selectedAppointment.total_price === 'string' ? parseFloat(selectedAppointment.total_price).toFixed(2) : selectedAppointment.total_price.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Time and Duration */}
                  <div>
                    <p className="text-xs text-pink-600 font-semibold uppercase tracking-wide mb-1">Time</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {format24to12Hour(selectedAppointment.booking_time)} - {calculateEndTime(selectedAppointment.booking_time, selectedAppointment.duration)} ({selectedAppointment.duration} min)
                    </p>
                  </div>

                  {/* Add-ons */}
                  {selectedAppointment.addons && selectedAppointment.addons.length > 0 && (
                    <div className="bg-pink-50 p-4 rounded-lg border-2 border-pink-200 mt-4">
                      <p className="text-xs text-pink-600 font-semibold uppercase tracking-wide mb-3">Add Ons</p>
                      <div className="space-y-2">
                        {Array.isArray(selectedAppointment.addons) ? (
                          selectedAppointment.addons.map((addon, idx) => (
                            <div key={idx} className="flex items-center">
                              <span className="text-pink-600 mr-2">✓</span>
                              <span className="font-semibold text-pink-900">
                                {typeof addon === 'string' ? toReadableTitle(addon) : (typeof addon === 'object' && addon !== null && 'name' in addon) ? (addon as any).name : JSON.stringify(addon)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="font-semibold text-pink-900">
                            {typeof selectedAppointment.addons === 'string' 
                              ? selectedAppointment.addons 
                              : JSON.stringify(selectedAppointment.addons)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Nail Art Notes */}
                  {selectedAppointment.nail_art_notes && (
                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200 mt-4">
                        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-2">Nail Art Notes</p>
                        <p className="text-sm text-blue-900 whitespace-pre-wrap">{selectedAppointment.nail_art_notes}</p>
                      </div>
                    )}

                    {/* Inspiration Pictures */}
                    <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300 mt-4">
                      {selectedAppointment.nail_art_image_urls && selectedAppointment.nail_art_image_urls.length > 0 ? (
                        <div>
                          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-3">Uploaded Pictures</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {selectedAppointment.nail_art_image_urls.map((url, idx) => (
                              <div key={idx} className="relative group cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                <img
                                  src={url}
                                  alt={`Nail art ${idx + 1}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImageUrl(url);
                                  }}
                                  className="w-full h-24 object-cover rounded border-2 border-blue-200 group-hover:opacity-75 transition"
                                />
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImageUrl(url);
                                  }}
                                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                >
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                  </svg>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center min-h-48">
                          <svg className="w-16 h-16 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-center text-gray-600 font-semibold">Inspiration Pictures</p>
                          <p className="text-center text-gray-500 text-xs mt-2">No pictures uploaded for this appointment</p>
                        </div>
                      )}
                    </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 p-6 border-t-2 border-gray-200 flex-shrink-0 bg-white">
                <button
                  onClick={() => handleEditBooking(selectedAppointment)}
                  className="flex-1 py-3 px-4 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 transition"
                >
                  Edit Appointment
                </button>
                <button
                  onClick={() => handleDeleteBooking(selectedAppointment)}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition"
                >
                  Delete Appointment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal - Overlays appointment details */}
        {editingBooking && selectedAppointment && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-[70] p-4"
            onClick={() => setEditingBooking(null)}
          >
            <div 
              className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white p-6 flex items-center justify-between flex-shrink-0">
                <h3 className="text-2xl font-bold">Edit Appointment</h3>
                <button
                  onClick={() => setEditingBooking(null)}
                  className="text-white hover:text-pink-100 text-3xl font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Calendar and Time Selection */}
                  <div className="lg:col-span-2">
                    <h4 className="font-bold text-lg text-gray-900 mb-4">Select Date & Time</h4>
                    <EditCalendar 
                      selectedDate={editDate}
                      onDateSelect={(date) => {
                        setEditDate(date);
                        setEditTime(''); // Clear time when date changes
                      }}
                      availableTimeSlotsMap={availableTimeSlotsMap}
                      selectedTime={editTime}
                      onTimeSelect={setEditTime}
                    />
                  </div>

                  {/* Right: Duration and Price */}
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-4">Details</h4>
                    
                    <div className="space-y-4">
                      {/* Name - Editable */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-600 text-gray-900 font-semibold text-sm"
                        />
                      </div>

                      {/* Phone - Editable */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Phone</label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="(xxx) xxx-xxxx"
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-600 text-gray-900 font-semibold text-sm"
                        />
                      </div>

                      {/* Service - Editable Dropdown */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Service</label>
                        <select
                          value={editService}
                          onChange={(e) => setEditService(e.target.value)}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-600 text-gray-900 font-semibold text-sm bg-white"
                        >
                          {editService && <option value={editService}>{toReadableTitle(editService)} (Current)</option>}
                          <option value="gel-manicure">Gel Manicure</option>
                          <option value="acrylic-nails">Acrylic Nails</option>
                          <option value="rebase">Rebase</option>
                          <option value="nail-art">Nail Art</option>
                        </select>
                      </div>

                      {/* Duration - Dropdown */}
                      <div>
                        <label className="block text-xs font-semibold text-pink-600 uppercase mb-2">Duration (minutes)</label>
                        <select
                          value={editDuration}
                          onChange={(e) => setEditDuration(parseInt(e.target.value) || 0)}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-600 text-gray-900 font-semibold text-sm bg-white"
                        >
                          {[30, 60, 90, 120, 150, 180, 210].map((duration) => (
                            <option key={duration} value={duration}>
                              {duration} min{editDuration === duration ? ' (Current)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Price */}
                      <div>
                        <label className="block text-xs font-semibold text-green-600 uppercase mb-2">Price ($)</label>
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                          step="0.01"
                          min="0"
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 text-gray-900 font-semibold text-lg"
                        />
                      </div>

                      {/* Summary */}
                      {editDate && editTime && (
                        <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-200 mt-4">
                          <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Summary</p>
                          <div className="text-xs text-blue-900 space-y-1">
                            <p><span className="font-bold">Time:</span> {editTime} - {calculateEndTime(editTime, editDuration)}</p>
                            <p><span className="font-bold">Duration:</span> {editDuration}m</p>
                            <p><span className="font-bold">Price:</span> ${editPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nail Art Section - Below main grid */}
                <div className="mt-6 bg-pink-50 p-4 rounded-lg border-2 border-pink-200">
                  <h4 className="font-bold text-lg text-gray-900 mb-4">Nail Art Details (Optional)</h4>
                  
                  <div className="space-y-4">
                    {/* Nail Art Notes */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Nail Art Notes</label>
                      <textarea
                        value={editNailArtNotes}
                        onChange={(e) => setEditNailArtNotes(e.target.value)}
                        placeholder="Describe nail art design, style preferences, colors, patterns, or any special requests..."
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-pink-600 text-sm text-gray-900 resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Nail Art Images */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-3">Inspiration Pictures</label>
                      
                      {/* File Upload Input */}
                      <div className="mb-4">
                        <label className="block">
                          <span className="text-xs font-semibold text-gray-700 mb-2 block">Upload New Pictures</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files) {
                                handleUploadNailArtImages(e.target.files);
                                e.target.value = ''; // Reset input
                              }
                            }}
                            className="w-full p-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-pink-600 text-sm text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-pink-50 file:text-pink-600 hover:file:bg-pink-100"
                          />
                        </label>
                      </div>

                      {/* Display existing images */}
                      {editNailArtImageUrls.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Current Images:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {editNailArtImageUrls.map((url, idx) => (
                              <div key={idx} className="relative group">
                                <img
                                  src={url}
                                  alt={`Nail art ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded border-2 border-pink-200 cursor-pointer"
                                  onClick={() => setSelectedImageUrl(url)}
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditNailArtImageUrls(editNailArtImageUrls.filter((_, i) => i !== idx))}
                                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition font-bold text-sm"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {editNailArtImageUrls.length === 0 && (
                        <p className="text-xs text-gray-500 italic">No pictures added yet. Upload inspiration pictures above.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 p-6 border-t-2 border-gray-200 bg-gray-50 flex-shrink-0">
                <button
                  onClick={() => setEditingBooking(null)}
                  className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-lg font-semibold text-gray-900 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBooking}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-lg font-semibold hover:from-pink-700 hover:to-pink-800 transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
