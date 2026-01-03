'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import GalleryManagement from './GalleryManagement';

const AVAILABLE_TIMES = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM',
];

// Base service options
const BASE_SERVICES = [
  { id: 'acrylic-short', name: 'Acrylic Sets - Short', duration: 120, basePrice: 50, type: 'acrylic' },
  { id: 'acrylic-long', name: 'Acrylic Sets - Long', duration: 150, basePrice: 60, type: 'acrylic' },
  { id: 'gel', name: 'Gel Manicure', duration: 60, basePrice: 35, type: 'gel' },
  { id: 'rebase', name: 'Rebase', duration: 60, basePrice: 40, type: 'rebase' },
];

// Optional removal service
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
  price: 0, // Variable
  durationAdd: 60,
};

const NAIL_DESIGN = [
  { id: 'ombre', name: 'Ombre', price: 15, durationAdd: 60 },
  { id: 'french', name: 'French', price: 15, durationAdd: 60 },
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
  admin_notes?: string;
  nail_art_images_count?: number;
  nail_art_image_urls?: string[];
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
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

// Helper function to format price with '+' suffix for nail art
function formatPrice(price: string | number, serviceId?: string): string {
  const formattedPrice = typeof price === 'string' ? parseFloat(price).toFixed(2) : price.toFixed(2);
  const suffix = serviceId === 'nail-art' ? '+' : '';
  return `$${formattedPrice}${suffix}`;
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
    return bookings.filter(b => b && b.booking_date === dateStr);
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg border-2 border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setDisplayMonth(Math.max(0, displayMonth - 1))}
          disabled={!canGoPrev}
          className={`px-2 py-1 text-lg font-bold transition ${
            canGoPrev
              ? 'text-gray-400 hover:text-gray-300 cursor-pointer'
              : 'text-gray-700 cursor-not-allowed'
          }`}
        >
          ←
        </button>
        <h3 className="text-lg font-semibold text-white flex-1 text-center">{monthName}</h3>
        <button
          type="button"
          onClick={() => setDisplayMonth(Math.min(3, displayMonth + 1))}
          disabled={!canGoNext}
          className={`px-2 py-1 text-lg font-bold transition ${
            canGoNext
              ? 'text-gray-400 hover:text-gray-300 cursor-pointer'
              : 'text-gray-700 cursor-not-allowed'
          }`}
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-semibold text-gray-400 text-xs h-6">
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
          
          // Check if the date is in the past
          const cellDate = new Date(year, month, day);
          cellDate.setHours(0, 0, 0, 0);
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          const isPast = cellDate < todayDate;

          return (
            <div
              key={day}
              onClick={() => onDateSelect(dateString)}
              className={`min-h-16 sm:min-h-24 p-1 rounded-lg border-2 transition cursor-pointer flex flex-col items-center justify-center sm:items-start sm:justify-start ${
                isBlocked || isPast
                  ? 'border-gray-800 bg-black'
                  : hasAppointments
                  ? 'border-gray-600 bg-gray-700'
                  : isSelected
                  ? 'border-gray-500 bg-gray-700'
                  : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center sm:items-start justify-center sm:justify-between gap-1 w-full">
                <div className={`font-semibold text-base sm:text-base ${isBlocked || isPast ? 'text-gray-700' : 'text-white'}`}>{day}</div>
                {isBlocked && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnblockDay(dateString);
                    }}
                    className="text-xs font-bold text-gray-600 hover:text-gray-500 hover:underline hidden sm:block"
                  >
                    ✕
                  </button>
                )}
              </div>
              {isBlocked || isPast ? (
                <div className="text-xs text-gray-600 font-semibold mt-1 hidden sm:block">{isBlocked ? 'BLOCKED' : 'PAST'}</div>
              ) : (
                <div className="hidden sm:block text-xs space-y-0.5 mt-1">
                  {dayAppointments.sort((a, b) => a.booking_time.localeCompare(b.booking_time)).slice(0, 2).map((apt) => (
                    <button
                      key={apt.id}
                      type="button"
                      onClick={() => onDateSelect(dateString)}
                      className="bg-gray-700 text-gray-300 px-1 py-0.5 rounded text-xs truncate block w-full text-left hover:bg-gray-600"
                    >
                      {format24to12Hour(apt.booking_time)} - {calculateEndTime(apt.booking_time, apt.duration)}
                    </button>
                  ))}
                  {dayAppointments.length > 2 && (
                    <button
                      type="button"
                      onClick={() => onDateSelect(dateString)}
                      className="text-gray-400 text-xs hover:underline"
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
function EditCalendar({ selectedDate, onDateSelect, availableTimeSlotsMap, selectedTime, onTimeSelect, durationMinutes = 0 }: { 
  selectedDate: string; 
  onDateSelect: (date: string) => void; 
  availableTimeSlotsMap: { [date: string]: Array<{ time: string; available: boolean; reason: string | null }> };
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  durationMinutes?: number;
}) {
  const [displayMonth, setDisplayMonth] = useState(0);

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const canFitDuration = (startTime: string, duration: number, allSlots: Array<{ time: string; available: boolean; reason: string | null }>): boolean => {
    if (duration === 0) return true; // If no duration set, show all slots
    
    const slotDurationMinutes = 30; // Each slot is 30 minutes
    const slotsNeeded = Math.ceil(duration / slotDurationMinutes);
    
    // Find the index of the starting slot
    const startIndex = allSlots.findIndex(slot => slot.time === startTime);
    if (startIndex === -1) return false;
    
    // Check if we have enough consecutive available slots starting from this slot
    let consecutiveAvailable = 0;
    for (let i = startIndex; i < allSlots.length; i++) {
      if (allSlots[i].available) {
        consecutiveAvailable++;
        if (consecutiveAvailable >= slotsNeeded) {
          return true;
        }
      } else {
        // Stop counting if we hit an unavailable slot
        break;
      }
    }
    return false;
  };

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
      <div className="bg-gray-900 p-4 rounded-lg border-2 border-gray-700">
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
                    ? 'bg-gray-700 text-white border-2 border-gray-600'
                    : canBook
                    ? 'bg-gray-800 text-white border-2 border-gray-700 hover:border-gray-600 hover:bg-gray-700 cursor-pointer'
                    : 'bg-gray-900 text-gray-600 border-2 border-gray-900 cursor-not-allowed'
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
        <div className="bg-gray-900 p-4 rounded-lg border-2 border-gray-700">
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-3">Available Times</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {timeSlotsForSelectedDate.map((slot) => {
              const canFit = canFitDuration(slot.time, durationMinutes, timeSlotsForSelectedDate);
              const slotDisabled = !slot.available || (durationMinutes > 0 && !canFit);
              
              return (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => !slotDisabled && onTimeSelect(slot.time)}
                  disabled={slotDisabled}
                  title={!slot.available ? `${slot.reason}` : slotDisabled ? 'Not enough consecutive time for this duration' : ''}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold transition ${
                    slotDisabled
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : selectedTime === slot.time
                      ? 'bg-gray-700 text-white border-2 border-gray-600'
                      : 'bg-gray-800 border-2 border-gray-700 text-white hover:border-gray-600 hover:bg-gray-700 cursor-pointer'
                  }`}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Admin Navigation Menu Component
function AdminNavMenu({ activeTab, setActiveTab, pendingCount }: { activeTab: 'calendar' | 'appointments' | 'gallery'; setActiveTab: (tab: 'calendar' | 'appointments' | 'gallery') => void; pendingCount: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col gap-1.5 justify-center items-center p-2"
        style={{ width: '50px', height: '50px' }}
      >
        <div style={{ width: '28px', height: '3px', backgroundColor: 'white' }}></div>
        <div style={{ width: '28px', height: '3px', backgroundColor: 'white' }}></div>
        <div style={{ width: '28px', height: '3px', backgroundColor: 'white' }}></div>
      </button>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="md:hidden fixed top-20 left-0 right-0 bg-black z-50 flex flex-col w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href="/"
              className="text-white font-bold text-lg py-4 px-4 border-b border-gray-700 hover:text-gray-300 transition"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <button
              onClick={() => {
                setActiveTab('appointments');
                setIsOpen(false);
              }}
              className="text-white font-bold text-lg py-4 px-4 border-b border-gray-700 hover:text-gray-300 transition text-left"
            >
              Appointments
            </button>
            <button
              onClick={() => {
                setActiveTab('calendar');
                setIsOpen(false);
              }}
              className="text-white font-bold text-lg py-4 px-4 border-b border-gray-700 hover:text-gray-300 transition text-left"
            >
              Calendar
            </button>
            <button
              onClick={() => {
                setActiveTab('gallery');
                setIsOpen(false);
              }}
              className="text-white font-bold text-lg py-4 px-4 hover:text-gray-300 transition text-left"
            >
              Gallery
            </button>
          </div>
        </>
      )}

      {/* Desktop Sidebar Menu */}
      {isOpen && (
        <div 
          className="hidden md:flex fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        >
          {/* Sidebar */}
          <div 
            className="ml-auto w-72 bg-black shadow-lg flex flex-col z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top section aligned with navbar */}
            <div className="flex justify-between items-center px-8 border-b border-gray-700" style={{ height: '80px' }}>
              <Link
                href="/"
                className="text-white font-bold text-2xl hover:text-gray-400 transition"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="text-2xl font-bold text-white hover:text-gray-400"
              >
                ✕
              </button>
            </div>
            {/* Menu items */}
            <div className="flex flex-col px-8 gap-6 pt-6">
              <button
                onClick={() => {
                  setActiveTab('appointments');
                  setIsOpen(false);
                }}
                className="text-white font-bold text-2xl hover:text-gray-400 transition py-4 text-left"
              >
                Appointments
              </button>
              <button
                onClick={() => {
                  setActiveTab('calendar');
                  setIsOpen(false);
                }}
                className="text-white font-bold text-2xl hover:text-gray-400 transition py-4 text-left"
              >
                Calendar
              </button>
              <button
                onClick={() => {
                  setActiveTab('gallery');
                  setIsOpen(false);
                }}
                className="text-white font-bold text-2xl hover:text-gray-400 transition py-4 text-left"
              >
                Gallery
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminPage() {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'calendar' | 'appointments' | 'gallery'>('appointments');
  const [appointmentFilter, setAppointmentFilter] = useState<'upcoming' | 'past' | 'pending'>('upcoming');
  const [selectedAppointment, setSelectedAppointment] = useState<Booking | null>(null);
  const [confirmingAppointment, setConfirmingAppointment] = useState<{ booking: Booking | null; finalPrice: number; sendSms: boolean }>({ booking: null, finalPrice: 0, sendSms: true });
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editTime, setEditTime] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDuration, setEditDuration] = useState(0);
  const [editPrice, setEditPrice] = useState(0);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editService, setEditService] = useState('');
  const [editNailArtNotes, setEditNailArtNotes] = useState('');
  const [editAdminNotes, setEditAdminNotes] = useState('');
  const [editNailArtImageUrls, setEditNailArtImageUrls] = useState<string[]>([]);
  const [editHasRemoval, setEditHasRemoval] = useState(false);
  const [editHasNailArt, setEditHasNailArt] = useState(false);
  const [editHasDesign, setEditHasDesign] = useState(false);
  const [isEditingAdminNotes, setIsEditingAdminNotes] = useState(false);
  const [tempAdminNotes, setTempAdminNotes] = useState('');
  const [adminNotesHasChanges, setAdminNotesHasChanges] = useState(false);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [blockedTimes, setBlockedTimes] = useState<Set<string>>(new Set());
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [availableTimeSlotsMap, setAvailableTimeSlotsMap] = useState<{ [date: string]: Array<{ time: string; available: boolean; reason: string | null }> }>({});
  
  // Appointment creation state
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [newAptDate, setNewAptDate] = useState('');
  const [newAptTime, setNewAptTime] = useState('');
  const [newAptName, setNewAptName] = useState('');
  const [newAptPhone, setNewAptPhone] = useState('');
  const [newAptService, setNewAptService] = useState('');
  const [newAptDuration, setNewAptDuration] = useState(60);
  const [newAptPrice, setNewAptPrice] = useState(0);
  const [newAptAddons, setNewAptAddons] = useState<string[]>([]);
  const [newAptHasRemoval, setNewAptHasRemoval] = useState(false);
  const [newAptHasNailArt, setNewAptHasNailArt] = useState(false);
  const [newAptHasDesign, setNewAptHasDesign] = useState(false);
  const [createAptError, setCreateAptError] = useState('');
  
  // Delete confirmation modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; booking: Booking | null }>({ show: false, booking: null });
  
  // Rejection modal state
  const [rejectionModal, setRejectionModal] = useState<{ show: boolean; booking: Booking | null; sendMessage: boolean }>({ show: false, booking: null, sendMessage: true });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Confirmation preview modal state
  const [confirmationPreview, setConfirmationPreview] = useState<{ show: boolean; booking: Booking | null; tempPrice: number }>({ show: false, booking: null, tempPrice: 0 });
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Overlap error state
  const [overlapError, setOverlapError] = useState<{ show: boolean; message: string; maxDuration: number }>({ show: false, message: '', maxDuration: 0 });
  
  // Custom dropdown state
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);
  const [editServiceDropdownOpen, setEditServiceDropdownOpen] = useState(false);
  const [editDurationDropdownOpen, setEditDurationDropdownOpen] = useState(false);
  // Handle query parameters on mount for navigation (e.g., ?tab=appointments&filter=pending)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const filterParam = params.get('filter');
    
    if (tabParam === 'appointments' || tabParam === 'calendar' || tabParam === 'gallery') {
      setActiveTab(tabParam);
    }
    
    if (filterParam === 'upcoming' || filterParam === 'past' || filterParam === 'pending') {
      setAppointmentFilter(filterParam);
    }
  }, []);

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
    if (selectedAppointment || selectedImageUrl || editingBooking || creatingAppointment) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedAppointment, selectedImageUrl, editingBooking, creatingAppointment]);

  // Close dropdowns when modal closes
  useEffect(() => {
    if (!creatingAppointment) {
      setServiceDropdownOpen(false);
      setDurationDropdownOpen(false);
    }
  }, [creatingAppointment]);
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

  const dayAppointments = selectedDate ? bookings.filter(b => b && b.booking_date === selectedDate) : [];

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
    setSelectedAppointment(booking);
    setEditingBooking(booking);
    setEditDate(booking.booking_date);
    setEditTime(booking.booking_time);
    setEditDuration(booking.duration);
    setEditPrice(typeof booking.total_price === 'string' ? parseFloat(booking.total_price) : booking.total_price);
    setEditName(booking.customer_name);
    setEditPhone(booking.customer_phone);
    setEditService(booking.service_id);
    setEditNailArtNotes(booking.nail_art_notes || '');
    setEditAdminNotes(booking.admin_notes || '');
    setEditNailArtImageUrls(booking.nail_art_image_urls || []);
    
    // Set add-ons based on booking addons
    const addons = booking.addons || [];
    setEditHasRemoval(addons.includes('removal'));
    setEditHasNailArt(addons.includes('nail-art'));
    setEditHasDesign(addons.some((addon) => ['french', 'ombre'].includes(addon)));
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
          admin_notes: editAdminNotes,
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
            admin_notes: editAdminNotes,
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

  const openCreateAppointmentModal = (date: string, time: string) => {
    setNewAptDate(date);
    setNewAptTime(time);
    setNewAptName('');
    setNewAptPhone('');
    setNewAptService('');
    setNewAptDuration(60);
    setNewAptPrice(0);
    setNewAptAddons([]);
    setNewAptHasRemoval(false);
    setNewAptHasNailArt(false);
    setNewAptHasDesign(false);
    setCreateAptError('');
    setCreatingAppointment(true);
  };

  // Helper function to check for appointment overlaps
  const checkAppointmentOverlap = (date: string, startTime: string, durationMinutes: number, excludeBookingId?: string): { hasOverlap: boolean; nextAppointmentTime: string | null; maxAvailableDuration: number } => {
    const AVAILABLE_TIMES = [
      '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
      '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM',
    ];

    // Convert time to minutes for easier comparison
    const timeToMinutes = (time: string): number => {
      const [timePart, period] = time.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + durationMinutes;

    // Get all appointments on this date, excluding the current one being edited
    const appointmentsOnDate = bookings.filter(b => b.booking_date === date && b.id !== excludeBookingId);

    // Check for overlaps and find next appointment
    let hasOverlap = false;
    let nextAppointmentTime: string | null = null;
    let minTimeToNextAppointment = Infinity;

    appointmentsOnDate.forEach(apt => {
      const aptStartMinutes = timeToMinutes(apt.booking_time);
      const aptEndMinutes = aptStartMinutes + apt.duration;

      // Check if there's overlap
      if (startMinutes < aptEndMinutes && endMinutes > aptStartMinutes) {
        hasOverlap = true;
      }

      // Find the next appointment after current start time
      if (aptStartMinutes > startMinutes) {
        const timeUntilNextApt = aptStartMinutes - startMinutes;
        if (timeUntilNextApt < minTimeToNextAppointment) {
          minTimeToNextAppointment = timeUntilNextApt;
          nextAppointmentTime = apt.booking_time;
        }
      }
    });

    // Calculate max available duration
    let maxAvailableDuration = 270; // Default to end of day (8:00 PM)
    if (nextAppointmentTime) {
      const nextAppointmentMinutes = timeToMinutes(nextAppointmentTime);
      maxAvailableDuration = Math.max(0, nextAppointmentMinutes - startMinutes - 15); // 15-min buffer
    }

    return { hasOverlap, nextAppointmentTime, maxAvailableDuration };
  };

  const calculateServiceDurationAndPrice = (serviceId: string, hasRemoval: boolean, hasNailArt: boolean, hasDesign: boolean) => {
    let duration = 0;
    let price = 0;
    const addons: string[] = [];

    // Get base service
    const baseService = BASE_SERVICES.find(s => s.id === serviceId);
    if (baseService) {
      duration = baseService.duration;
      price = baseService.basePrice;
    }

    // Add removal
    if (hasRemoval) {
      duration += REMOVAL_SERVICE.duration;
      price += REMOVAL_SERVICE.price;
      addons.push(REMOVAL_SERVICE.id);
    }

    // Add nail art
    if (hasNailArt) {
      duration += NAIL_ART.durationAdd;
      addons.push(NAIL_ART.id);
    }

    // Add design
    if (hasDesign) {
      duration += 60;
      price += 15;
      addons.push('design');
    }

    return { duration, price, addons };
  };

  const handleServiceChange = (serviceId: string) => {
    setNewAptService(serviceId);
    const { duration, price, addons } = calculateServiceDurationAndPrice(serviceId, newAptHasRemoval, newAptHasNailArt, newAptHasDesign);
    setNewAptDuration(duration);
    setNewAptPrice(price);
    setNewAptAddons(addons);
  };

  const handleRemovalChange = (hasRemoval: boolean) => {
    const { duration, price, addons } = calculateServiceDurationAndPrice(newAptService, hasRemoval, newAptHasNailArt, newAptHasDesign);
    setNewAptHasRemoval(hasRemoval);
    setNewAptDuration(duration);
    setNewAptPrice(price);
    setNewAptAddons(addons);
  };

  const handleNailArtChange = (hasNailArt: boolean) => {
    const { duration, price, addons } = calculateServiceDurationAndPrice(newAptService, newAptHasRemoval, hasNailArt, newAptHasDesign);
    setNewAptHasNailArt(hasNailArt);
    setNewAptDuration(duration);
    setNewAptPrice(price);
    setNewAptAddons(addons);
  };

  const handleDesignChange = (hasDesign: boolean) => {
    const { duration, price, addons } = calculateServiceDurationAndPrice(newAptService, newAptHasRemoval, newAptHasNailArt, hasDesign);
    setNewAptHasDesign(hasDesign);
    setNewAptDuration(duration);
    setNewAptPrice(price);
    setNewAptAddons(addons);
  };

  // Edit handlers - auto-calculate price when service or add-ons change
  const handleEditServiceChange = (serviceId: string) => {
    setEditService(serviceId);
    const { duration, price, addons } = calculateServiceDurationAndPrice(serviceId, editHasRemoval, editHasNailArt, editHasDesign);
    setEditDuration(duration);
    setEditPrice(price);
  };

  const handleEditRemovalChange = (hasRemoval: boolean) => {
    const { duration, price, addons } = calculateServiceDurationAndPrice(editService, hasRemoval, editHasNailArt, editHasDesign);
    setEditHasRemoval(hasRemoval);
    setEditDuration(duration);
    setEditPrice(price);
  };

  const handleEditNailArtChange = (hasNailArt: boolean) => {
    const { duration, price, addons } = calculateServiceDurationAndPrice(editService, editHasRemoval, hasNailArt, editHasDesign);
    setEditHasNailArt(hasNailArt);
    setEditDuration(duration);
    setEditPrice(price);
  };

  const handleEditDesignChange = (hasDesign: boolean) => {
    const { duration, price, addons } = calculateServiceDurationAndPrice(editService, editHasRemoval, editHasNailArt, hasDesign);
    setEditHasDesign(hasDesign);
    setEditDuration(duration);
    setEditPrice(price);
  };

  // Wrapper for duration changes with overlap checking
  const handleEditDurationChange = (newDuration: number) => {
    if (!editingBooking || !editDate || !editTime) return;

    const { hasOverlap, nextAppointmentTime, maxAvailableDuration } = checkAppointmentOverlap(editDate, editTime, newDuration, editingBooking.id);
    
    if (hasOverlap) {
      setOverlapError({
        show: true,
        message: `Cannot extend to ${newDuration} minutes. This would overlap with the next appointment at ${nextAppointmentTime}.`,
        maxDuration: maxAvailableDuration
      });
      return;
    }

    setOverlapError({ show: false, message: '', maxDuration: 0 });
    setEditDuration(newDuration);
  };

  // Wrapper for time changes with overlap checking
  const handleEditTimeChange = (newTime: string) => {
    if (!editingBooking || !editDate) return;

    const { hasOverlap, nextAppointmentTime, maxAvailableDuration } = checkAppointmentOverlap(editDate, newTime, editDuration, editingBooking.id);
    
    if (hasOverlap) {
      setOverlapError({
        show: true,
        message: `Cannot schedule at ${newTime}. This would overlap with the next appointment at ${nextAppointmentTime}.`,
        maxDuration: maxAvailableDuration
      });
      return;
    }

    setOverlapError({ show: false, message: '', maxDuration: 0 });
    setEditTime(newTime);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAptName || !newAptService || !newAptDate || !newAptTime) {
      setCreateAptError('Please fill in all required fields');
      return;
    }

    if (newAptPrice < 0) {
      setCreateAptError('Price must be a positive number');
      return;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newAptName,
          customerPhone: newAptPhone,
          baseService: { id: newAptService, name: '', duration: newAptDuration, basePrice: 0, type: '' },
          date: newAptDate,
          time: newAptTime,
          totalDuration: newAptDuration,
          totalPrice: newAptPrice,
          addons: newAptAddons.map((id) => ({ id, name: '', price: 0 })),
          nailArtNotes: '',
          nailArtImagesCount: 0,
          nailArtImageUrls: [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Add new booking to the list
          setBookings([...bookings, data.booking]);
          setCreatingAppointment(false);
          setSaveMessage('Appointment created successfully');
          setTimeout(() => setSaveMessage(''), 2000);
          
          // Refresh availability
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
          setCreateAptError(data.error || 'Failed to create appointment');
        }
      } else {
        const errorData = await response.json();
        setCreateAptError(errorData.error || 'Failed to create appointment');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      setCreateAptError('An error occurred while creating the appointment');
    }
  };

  const handleSaveAdminNotes = async (notes: string) => {
    if (!selectedAppointment) return;

    try {
      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedAppointment.id,
          admin_notes: notes,
        }),
      });

      if (response.ok) {
        const updatedAppointment = {
          ...selectedAppointment,
          admin_notes: notes,
        };
        setSelectedAppointment(updatedAppointment);
        setBookings(bookings.map(b => b.id === selectedAppointment.id ? updatedAppointment : b));
        setAdminNotesHasChanges(false);
      }
    } catch (error) {
      console.error('Error saving admin notes:', error);
    }
  };

  const handleConfirmAppointment = async (booking: Booking) => {
    // Set the selected appointment to open the modal
    setSelectedAppointment(booking);
    // Then set confirmation mode
    setConfirmingAppointment({
      booking: booking,
      finalPrice: booking.total_price,
      sendSms: true,
    });
  };

  const handleFinalConfirmAppointment = async () => {
    if (!confirmingAppointment.booking) return;

    try {
      const bookingToConfirm = confirmingAppointment.booking;
      const response = await fetch('/api/appointments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: bookingToConfirm.id,
          finalPrice: confirmingAppointment.finalPrice,
          sendSms: confirmingAppointment.sendSms,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        const updatedBooking: Booking = {
          ...bookingToConfirm,
          status: 'confirmed',
          total_price: confirmingAppointment.finalPrice,
        };
        setBookings(bookings.map(b => b.id === bookingToConfirm.id ? updatedBooking : b));
        setSelectedAppointment(null);
        setConfirmingAppointment({ booking: null, finalPrice: 0, sendSms: true });
        setSaveMessage('Appointment confirmed' + (confirmingAppointment.sendSms ? ' and customer notified' : ''));
        setTimeout(() => setSaveMessage(''), 2000);
      } else {
        alert(`Failed to confirm appointment: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error confirming appointment:', error);
      alert('An error occurred while confirming the appointment');
    }
  };

  const handleRejectAppointment = async (booking: Booking) => {
    // Show rejection modal
    setRejectionModal({
      show: true,
      booking: booking,
      sendMessage: true,
    });
  };

  const handleFinalRejectAppointment = async () => {
    if (!rejectionModal.booking) return;

    const bookingToReject = rejectionModal.booking;

    try {
      // Send rejection SMS to customer if checkbox is checked
      if (rejectionModal.sendMessage) {
        try {
          await fetch('/api/appointments/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: bookingToReject.id,
              customerPhone: bookingToReject.customer_phone,
              customerName: bookingToReject.customer_name,
              sendMessage: true,
            }),
          });
        } catch (smsError) {
          console.error('Failed to send rejection SMS:', smsError);
          // Don't fail the rejection if SMS fails
        }
      }

      // Delete the appointment (isRejection flag prevents SMS to Kinsey)
      const response = await fetch(`/api/bookings?bookingId=${bookingToReject.id}&isRejection=true`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setBookings(bookings.filter(b => b.id !== bookingToReject.id));
        setSelectedAppointment(null);
        setEditingBooking(null);
        setRejectionModal({ show: false, booking: null, sendMessage: true });
        setSaveMessage('Appointment rejected successfully');
        setTimeout(() => setSaveMessage(''), 2000);
        
        // Refresh availability to reflect the freed time slots
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
        alert('Failed to reject appointment');
      }
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert('An error occurred while rejecting the appointment');
    }
  };

  const handleDeleteBooking = async (booking: Booking) => {
    setDeleteConfirmation({ show: true, booking });
  };

  const confirmDeleteBooking = async () => {
    if (!deleteConfirmation.booking) return;
    
    const booking = deleteConfirmation.booking;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/bookings?bookingId=${booking.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = await response.json();

      if (response.ok) {
        setBookings(bookings.filter((b) => b.id !== booking.id));
        setSelectedAppointment(null);
        setEditingBooking(null);
        setSaveMessage('Appointment deleted successfully');
        setTimeout(() => setSaveMessage(''), 2000);
        
        // Immediately unlock the time slots on the calendar
        const AVAILABLE_TIMES = [
          '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
          '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
          '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM',
        ];
        
        // Calculate which times should be unlocked
        const timeIndex = AVAILABLE_TIMES.indexOf(booking.booking_time);
        if (timeIndex !== -1) {
          const totalMinutesWithBuffer = booking.duration + 15;
          const slotsNeeded = Math.ceil(totalMinutesWithBuffer / 30);
          
          const unlockedTimes = new Set<string>();
          for (let i = 0; i < slotsNeeded; i++) {
            if (timeIndex + i < AVAILABLE_TIMES.length) {
              unlockedTimes.add(AVAILABLE_TIMES[timeIndex + i]);
            }
          }
          
          // Update availableTimeSlotsMap to unlock these times
          setAvailableTimeSlotsMap(prevMap => {
            const updatedMap = { ...prevMap };
            if (updatedMap[booking.booking_date]) {
              updatedMap[booking.booking_date] = updatedMap[booking.booking_date].map(slot => 
                unlockedTimes.has(slot.time) ? { ...slot, available: true, reason: null } : slot
              );
            }
            return updatedMap;
          });
        }
        
        // Refresh availability to ensure sync with database
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
        alert(`Failed to delete appointment: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('An error occurred while deleting the appointment');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation({ show: false, booking: null });
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black">
        <header className="bg-black border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-3xl font-bold text-white">
                KJ Nails
              </Link>
              <Link href="/" className="text-gray-400 hover:text-white">
                ← Back to Home
              </Link>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navigation - Same as home page */}
      <nav className="sticky top-0 z-50 bg-black border-b border-gray-900 flex justify-between items-center md:justify-start" style={{height: '80px', padding: '4px 0 4px 10px', margin: 0, overflow: 'hidden'}}>
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
        <div style={{margin: 0, height: '100%', display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center'}} className="md:hidden">
          <button
            onClick={() => setActiveTab(activeTab === 'calendar' ? 'appointments' : 'calendar')}
            className="p-2 hover:opacity-75 transition"
            title="Calendar"
          >
            <svg className={`w-8 h-8 ${activeTab === 'calendar' ? 'text-gray-500' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <div style={{margin: 0, height: '100%', marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: '16px'}}>
          <AdminNavMenu activeTab={activeTab} setActiveTab={setActiveTab} pendingCount={bookings.filter(b => b.status === 'pending').length} />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-12">

        {saveMessage && (
          <div className="mb-6 p-4 bg-gray-800 border-2 border-gray-600 text-gray-300 rounded-lg text-center">
            {saveMessage}
          </div>
        )}

        {/* Hide old tabs section since we're using dropdown */}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div>
            {/* Calendar - Full Width */}
            <div className="mb-8">
              <OperatorCalendar bookings={bookings} selectedDate={selectedDate} onDateSelect={setSelectedDate} blockedDates={blockedDates} onUnblockDay={unblockEntireDay} />
            </div>

            {/* Hour Grid with Appointments */}
            {selectedDate && (
              <div className="bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4 gap-4">
                  <h3 className="text-lg font-semibold text-white">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h3>
                  
                  <div className="flex gap-2">
                    {!blockedDates.has(selectedDate) && (
                      <button
                        onClick={blockEntireDay}
                        className="py-1 px-3 text-sm font-semibold text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded transition"
                      >
                        Block Entire Day
                      </button>
                    )}
                    {blockedDates.has(selectedDate) && (
                      <button
                        onClick={unblockEntireDay}
                        className="py-1 px-3 text-sm font-semibold text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded transition"
                      >
                        Unblock Entire Day
                      </button>
                    )}
                  </div>
                </div>

                {/* Hour Grid */}
                <div className="mb-6 border-2 border-gray-700 rounded-lg overflow-hidden">
                  {/* Grid Header and Content */}
                  <div className="grid grid-cols-[120px_1fr] divide-x-2 divide-gray-700 min-h-96">
                    {/* Time Labels Column */}
                    <div className="bg-gray-800 divide-y-2 divide-gray-700">
                      {AVAILABLE_TIMES.map((time) => (
                        <div 
                          key={`time-${time}`} 
                          className="h-16 flex items-center justify-center text-xs font-semibold text-gray-400 bg-gray-800"
                        >
                          {time}
                        </div>
                      ))}
                    </div>

                    {/* Appointment and Block Grid */}
                    <div className="relative bg-gray-950">
                      {/* Background grid lines */}
                      <div className="absolute inset-0 pointer-events-none">
                        {AVAILABLE_TIMES.map((time, idx) => (
                          <div
                            key={`line-${time}`}
                            className="border-b border-gray-800 absolute w-full"
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
                          <div className="absolute inset-0 bg-gray-800 border-2 border-gray-600 flex items-center justify-center">
                            <span className="font-bold text-gray-400">ENTIRE DAY BLOCKED</span>
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
                                  ? 'border-gray-500 bg-gray-700'
                                  : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                              }`}
                              style={{
                                top: `${topPercent}%`,
                                height: `${heightPercent}%`,
                              }}
                            >
                              {/* Left side - Info */}
                              <div className="flex-1 text-left min-w-0 flex flex-col justify-between">
                                <div>
                                  <div className="font-bold text-white text-lg leading-tight">{apt.customer_name}</div>
                                  <div className="text-sm text-gray-300 font-semibold leading-tight">{new Date(`${apt.booking_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {format24to12Hour(apt.booking_time)} - {calculateEndTime(apt.booking_time, apt.duration)}</div>
                                  <div className="text-sm text-gray-400 leading-tight">{toReadableTitle(apt.service_id)}</div>
                                  {apt.addons && apt.addons.length > 0 && (
                                    <div className="text-sm text-gray-400 mt-0.5 leading-tight">
                                      Add Ons: {Array.isArray(apt.addons) ? apt.addons.map(toReadableTitle).join(', ') : apt.addons}
                                    </div>
                                  )}
                                  <div className="text-sm text-gray-400 leading-tight">{apt.customer_phone}</div>
                                </div>
                                <div className="text-sm text-gray-300 leading-tight mt-1">
                                  {formatPrice(apt.total_price, apt.service_id)}
                                </div>
                              </div>

                              {/* Right side - Picture placeholder removed */}
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
                            <div
                              key={`block-${time}`}
                              className="absolute left-1 right-1 rounded-lg border-2 transition flex items-center justify-between p-1 gap-1"
                              style={{
                                top: `${topPercent}%`,
                                height: `${heightPercent}%`,
                                borderColor: isBlocked ? '#4b5563' : '#374151',
                                backgroundColor: isBlocked ? '#374151' : '#111827',
                              }}
                            >
                              {/* Left side - Block toggle */}
                              <button
                                onClick={() => toggleBlockTime(time)}
                                className="h-full flex items-center justify-center rounded hover:bg-gray-700 transition"
                                style={{ flex: '5' }}
                                title={isBlocked ? 'Unblock time' : 'Block time'}
                              >
                                <span className="text-xs font-semibold text-gray-400">{isBlocked ? '🔒' : ''}</span>
                              </button>

                              {/* Right side - Create appointment button */}
                              <button
                                onClick={() => openCreateAppointmentModal(selectedDate, time)}
                                className="h-full flex items-center justify-center rounded border-2 border-gray-500 hover:border-gray-300 hover:bg-gray-700 transition"
                                style={{ flex: '1' }}
                                title="Create appointment"
                              >
                                <span className="text-lg font-bold text-gray-500 hover:text-gray-300">+</span>
                              </button>
                            </div>
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
          <div className="bg-gray-900 rounded-lg shadow-lg p-4 sm:p-6 border border-gray-700">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg font-semibold text-white mb-3 sm:mb-4">Appointments</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setCreatingAppointment(true)}
                  className="px-3 py-2 rounded-lg font-semibold bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-gray-600 transition"
                  title="Create new appointment"
                >
                  +
                </button>
                <button
                  onClick={() => setAppointmentFilter('upcoming')}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition ${
                    appointmentFilter === 'upcoming'
                      ? 'bg-gray-700 text-white border-2 border-gray-600'
                      : 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setAppointmentFilter('past')}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition ${
                    appointmentFilter === 'past'
                      ? 'bg-gray-700 text-white border-2 border-gray-600'
                      : 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  Past
                </button>
                <button
                  onClick={() => setAppointmentFilter('pending')}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition ${
                    appointmentFilter === 'pending'
                      ? 'bg-gray-700 text-white border-2 border-gray-600'
                      : 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  Pending {bookings.filter(b => b.status === 'pending').length > 0 && `(${bookings.filter(b => b.status === 'pending').length})`}
                </button>
              </div>
            </div>
            {bookings.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No appointments yet</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookings
                  .filter((booking) => {
                    if (!booking || !booking.booking_date || !booking.booking_time) return false;
                    
                    // For pending filter, show appointments with pending status
                    if (appointmentFilter === 'pending') {
                      return booking.status === 'pending';
                    }
                    
                    // For upcoming/past filters, show confirmed appointments (or bookings without status for backward compatibility)
                    if (booking.status && booking.status !== 'confirmed') return false;
                    const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
                    const now = new Date();
                    if (appointmentFilter === 'upcoming') {
                      return bookingDateTime >= now;
                    } else {
                      return bookingDateTime < now;
                    }
                  })
                  .sort((a, b) => {
                    const dateTimeA = new Date(`${a.booking_date}T${a.booking_time}`);
                    const dateTimeB = new Date(`${b.booking_date}T${b.booking_time}`);
                    return dateTimeA.getTime() - dateTimeB.getTime();
                  })
                  .map((booking) => (
                      <div
                        key={booking.id}
                        onClick={() => {
                          setSelectedAppointment(booking);
                          // Auto-enter confirmation mode for pending appointments
                          if (booking.status === 'pending') {
                            setConfirmingAppointment({
                              booking: booking,
                              finalPrice: booking.total_price,
                              sendSms: true,
                            });
                          }
                        }}
                        className="border-2 border-gray-700 rounded-lg p-4 hover:border-gray-600 hover:shadow-lg hover:bg-gray-800 transition cursor-pointer bg-gray-800"
                      >
                        <div className="space-y-2">
                          {/* Name and Phone */}
                          <div>
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Name</p>
                            <div className="flex items-baseline gap-2">
                              <p className="text-base font-bold text-white">{booking.customer_name}</p>
                              <p className="text-xs text-gray-500">{booking.customer_phone}</p>
                            </div>
                          </div>

                          {/* Date & Time */}
                          <div>
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Appointment</p>
                            <p className="text-xs font-semibold text-gray-400">
                              {new Date(`${booking.booking_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {format24to12Hour(booking.booking_time)} - {calculateEndTime(booking.booking_time, booking.duration)}
                            </p>
                          </div>

                          {/* Service and Price */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex-1">
                              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Service</p>
                              <p className="text-xs text-gray-300">{toReadableTitle(booking.service_id)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Price</p>
                              <p className="text-xs font-bold text-green-600">
                                {formatPrice(booking.total_price, booking.service_id)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons for Pending Appointments */}
                        {appointmentFilter === 'pending' && (
                          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-700">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmAppointment(booking);
                              }}
                              className="flex-1 py-2 px-3 rounded-lg font-semibold text-sm bg-gray-600 text-white hover:bg-gray-500 transition text-center"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectAppointment(booking);
                              }}
                              className="py-2 px-3 rounded-lg font-semibold text-sm bg-gray-600 text-white hover:bg-gray-500 transition text-center"
                              title="Reject appointment"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
            )}
          </div>
        )}

        {/* Selected Appointment Details Modal - Outside tabs so it shows on both calendar and appointments view */}
        {selectedAppointment && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedAppointment(null)}
          >
            <div 
              className="bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gray-800 border-b-2 border-gray-700 p-6 flex items-center justify-between flex-shrink-0">
                <h4 className="font-bold text-xl text-white">Appointment Details</h4>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-300 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-4">
                  {/* Name and Phone - One Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Name</p>
                      <p className="text-sm font-bold text-white">{selectedAppointment.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Phone</p>
                      <p className="text-xs text-gray-300">{selectedAppointment.customer_phone}</p>
                    </div>
                  </div>

                  {/* Service and Price - One Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Service</p>
                      <p className="text-sm text-gray-300">{toReadableTitle(selectedAppointment.service_id)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Price</p>
                      <p className="text-sm font-bold text-gray-300">{formatPrice(selectedAppointment.total_price, selectedAppointment.service_id)}</p>
                    </div>
                  </div>

                  {/* Time and Duration */}
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Time</p>
                    <p className="text-sm font-semibold text-white">
                      {new Date(`${selectedAppointment.booking_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {format24to12Hour(selectedAppointment.booking_time)} - {calculateEndTime(selectedAppointment.booking_time, selectedAppointment.duration)} ({selectedAppointment.duration} min)
                    </p>
                  </div>

                  {/* Admin Notes */}
                  <div className="bg-gray-800 p-4 rounded-lg border-2 border-gray-700 mt-4">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Admin Notes</p>
                    <div className="space-y-2">
                      <textarea
                        value={selectedAppointment.admin_notes || ''}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setSelectedAppointment({
                            ...selectedAppointment,
                            admin_notes: newValue,
                          });
                          setAdminNotesHasChanges(newValue !== (selectedAppointment.admin_notes || ''));
                        }}
                        placeholder="Add internal notes about this appointment..."
                        className="w-full p-3 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-gray-600 text-sm text-white resize-none bg-gray-700"
                        rows={3}
                      />
                      {adminNotesHasChanges && (
                        <button
                          onClick={() => handleSaveAdminNotes(selectedAppointment.admin_notes || '')}
                          className="w-full px-3 py-2 bg-gray-700 text-white text-sm font-semibold rounded hover:bg-gray-600 transition"
                        >
                          Save Notes
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Add-ons */}
                  {selectedAppointment.addons && selectedAppointment.addons.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-lg border-2 border-gray-700 mt-4">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Add Ons</p>
                      <div className="space-y-2">
                        {Array.isArray(selectedAppointment.addons) ? (
                          selectedAppointment.addons.map((addon, idx) => (
                            <div key={idx} className="flex items-center">
                              <span className="text-gray-400 mr-2">✓</span>
                              <span className="font-semibold text-gray-300">
                                {typeof addon === 'string' ? toReadableTitle(addon) : (typeof addon === 'object' && addon !== null && 'name' in addon) ? (addon as any).name : JSON.stringify(addon)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="font-semibold text-gray-600">
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
                    <div className="bg-gray-800 p-4 rounded-lg border-2 border-gray-700 mt-4">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Nail Art Notes</p>
                        <p className="text-sm text-gray-400 whitespace-pre-wrap">{selectedAppointment.nail_art_notes}</p>
                      </div>
                    )}

                    {/* Inspiration Pictures */}
                    <div className="bg-gray-800 p-4 rounded-lg border-2 border-dashed border-gray-700 mt-4">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Uploaded Pictures</p>
                      {selectedAppointment.nail_art_image_urls && selectedAppointment.nail_art_image_urls.length > 0 ? (
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
                                className="w-full h-24 object-cover rounded border-2 border-gray-700 group-hover:opacity-75 transition"
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
                      ) : (
                        <p className="text-sm text-gray-500">No pictures</p>
                      )}
                    </div>
                </div>
              </div>

              {/* Confirmation Mode - Price and SMS Options */}
              {confirmingAppointment.booking?.id === selectedAppointment.id && confirmingAppointment.booking && (
                <div className="px-6 py-2 border-t-2 border-gray-700 bg-gray-800 space-y-2">
                  {/* Price Section - Inline Compact */}
                  <div className="flex items-center gap-2 bg-gray-700 bg-opacity-40 border-2 border-gray-600 p-2 rounded h-11">
                    <p className="text-xs text-gray-400 font-semibold uppercase whitespace-nowrap">Price:</p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-white">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={confirmingAppointment.finalPrice === 0 ? '' : confirmingAppointment.finalPrice}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setConfirmingAppointment({ ...confirmingAppointment, finalPrice: 0 });
                          } else {
                            const parsed = parseFloat(value);
                            if (!isNaN(parsed)) {
                              setConfirmingAppointment({ ...confirmingAppointment, finalPrice: parsed });
                            }
                          }
                        }}
                        placeholder="0.00"
                        className="w-16 px-1 py-0.5 border-2 border-gray-600 rounded focus:outline-none focus:border-gray-500 text-white font-bold text-sm bg-gray-800"
                      />
                    </div>
                  </div>

                  {/* SMS Checkbox - Inline Compact */}
                  <div className="flex items-center bg-gray-700 bg-opacity-40 border-2 border-gray-600 p-2 rounded h-11">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmingAppointment.sendSms}
                        onChange={(e) => setConfirmingAppointment({ ...confirmingAppointment, sendSms: e.target.checked })}
                        className="w-6 h-6 cursor-pointer"
                      />
                      <span className="text-white text-xs font-semibold whitespace-nowrap">Send SMS</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 p-6 border-t-2 border-gray-700 flex-shrink-0 bg-gray-800">
                {confirmingAppointment.booking?.id === selectedAppointment.id && confirmingAppointment.booking ? (
                  <>
                    <button
                      onClick={() => handleEditBooking(selectedAppointment)}
                      className="py-3 px-4 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-500 transition"
                      title="Edit appointment"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRejectAppointment(selectedAppointment)}
                      className="py-3 px-4 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-500 transition"
                      title="Reject appointment"
                    >
                      Reject
                    </button>
                    <button
                      onClick={handleFinalConfirmAppointment}
                      className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-500 transition"
                    >
                      Confirm
                    </button>
                  </>
                ) : selectedAppointment.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleEditBooking(selectedAppointment)}
                      className="py-3 px-4 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-500 transition"
                      title="Edit appointment"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleConfirmAppointment(selectedAppointment)}
                      className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-500 transition"
                    >
                      Confirm Appointment
                    </button>
                    <button
                      onClick={() => handleRejectAppointment(selectedAppointment)}
                      className="py-3 px-4 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-500 transition"
                      title="Reject appointment"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditBooking(selectedAppointment)}
                      className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-500 transition"
                    >
                      Edit Appointment
                    </button>
                    <button
                      onClick={() => handleDeleteBooking(selectedAppointment)}
                      className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-500 transition"
                    >
                      Delete Appointment
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal - Overlays appointment details */}
        {editingBooking && selectedAppointment && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-[70] p-4"
            onClick={() => {
              setEditingBooking(null);
              setSelectedAppointment(null);
            }}
          >
            <div 
              className="bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gray-800 text-white p-6 flex items-center justify-between flex-shrink-0 border-b border-gray-700">
                <h3 className="text-2xl font-bold">Edit Appointment</h3>
                <button
                  onClick={() => setEditingBooking(null)}
                  className="text-gray-400 hover:text-gray-300 text-3xl font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Calendar and Time Selection */}
                  <div className="lg:col-span-2">
                    <h4 className="font-bold text-lg text-white mb-4">Select Date & Time</h4>
                    <EditCalendar 
                      selectedDate={editDate}
                      onDateSelect={(date) => {
                        setEditDate(date);
                        setEditTime(''); // Clear time when date changes
                      }}
                      availableTimeSlotsMap={availableTimeSlotsMap}
                      selectedTime={editTime}
                      onTimeSelect={handleEditTimeChange}
                    />
                  </div>

                  {/* Right: Duration and Price */}
                  <div>
                    <h4 className="font-bold text-lg text-white mb-4">Details</h4>
                    
                    <div className="space-y-4">
                      {/* Name - Editable */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full p-3 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-gray-600 text-white font-semibold text-sm bg-gray-800"
                        />
                      </div>

                      {/* Phone - Editable */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Phone</label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="(xxx) xxx-xxxx"
                          className="w-full p-3 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-gray-600 text-white font-semibold text-sm bg-gray-800"
                        />
                      </div>

                      {/* Service - Editable Custom Dropdown */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Service</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setEditServiceDropdownOpen(!editServiceDropdownOpen)}
                            className="w-full p-3 border-2 border-gray-700 rounded-lg text-white font-semibold text-sm bg-gray-800 hover:border-gray-600 transition text-left flex justify-between items-center"
                          >
                            <span>{editService ? BASE_SERVICES.find(s => s.id === editService)?.name || toReadableTitle(editService) : 'Select a service'}</span>
                            <span className="text-xs">▼</span>
                          </button>
                          {editServiceDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-lg z-10">
                              {BASE_SERVICES.map((service) => (
                                <button
                                  key={service.id}
                                  type="button"
                                  onClick={() => {
                                    handleEditServiceChange(service.id);
                                    setEditServiceDropdownOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 text-left transition ${
                                    editService === service.id
                                      ? 'bg-gray-700 text-white'
                                      : 'text-gray-300 hover:bg-gray-700'
                                  }`}
                                >
                                  {service.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Add-ons Section - Right after Service */}
                      <div className="bg-gray-800 p-3 rounded-lg border-2 border-gray-700 space-y-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Add-ons</p>
                        
                        {/* Removal Checkbox */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editHasRemoval}
                            onChange={(e) => handleEditRemovalChange(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-300">Removal (+{REMOVAL_SERVICE.duration} min, +${REMOVAL_SERVICE.price})</span>
                        </label>

                        {/* Nail Art Checkbox */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editHasNailArt}
                            onChange={(e) => handleEditNailArtChange(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-300">Nail Art (+{NAIL_ART.durationAdd} min)</span>
                        </label>

                        {/* Design Checkbox (French or Ombre) */}
                        {editService && !['nail-art'].includes(editService) && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editHasDesign}
                              onChange={(e) => handleEditDesignChange(e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-300">French or Ombre (+60 min, +$15)</span>
                          </label>
                        )}
                      </div>

                      {/* Overlap Error Alert */}
                      {overlapError.show && (
                        <div className="bg-red-900 border-2 border-red-600 p-4 rounded-lg">
                          <p className="text-sm font-semibold text-red-200 mb-2">⚠️ Scheduling Conflict</p>
                          <p className="text-xs text-red-100 mb-2">{overlapError.message}</p>
                          {overlapError.maxDuration > 0 && (
                            <p className="text-xs text-red-100">
                              <span className="font-semibold">Max available duration:</span> {overlapError.maxDuration} minutes
                            </p>
                          )}
                        </div>
                      )}

                      {/* Duration - Custom Dropdown */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Duration (minutes)</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setEditDurationDropdownOpen(!editDurationDropdownOpen)}
                            className="w-full p-3 border-2 border-gray-700 rounded-lg text-white font-semibold text-sm bg-gray-800 hover:border-gray-600 transition text-left flex justify-between items-center"
                          >
                            <span>{editDuration > 0 ? `${editDuration} min` : 'Select duration'}</span>
                            <span className="text-xs">▼</span>
                          </button>
                          {editDurationDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                              {[30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270].map((duration) => (
                                <button
                                  key={duration}
                                  type="button"
                                  onClick={() => {
                                    handleEditDurationChange(duration);
                                    setEditDurationDropdownOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 text-left transition ${
                                    editDuration === duration
                                      ? 'bg-gray-700 text-white'
                                      : 'text-gray-300 hover:bg-gray-700'
                                  }`}
                                >
                                  {duration} min
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Price ($)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editPrice === 0 ? '' : editPrice}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setEditPrice(0);
                            } else {
                              const parsed = parseFloat(value);
                              if (!isNaN(parsed)) {
                                setEditPrice(parsed);
                              }
                            }
                          }}
                          placeholder="0.00"
                          className="w-full p-3 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-gray-600 text-white font-semibold text-lg bg-gray-800"
                        />
                      </div>

                      {/* Summary */}
                      {editDate && editTime && (
                        <div className="bg-gray-800 p-3 rounded-lg border-2 border-gray-700 mt-4">
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Summary</p>
                          <div className="text-xs text-gray-300 space-y-1">
                            <p><span className="font-bold">Time:</span> {editTime} - {calculateEndTime(editTime, editDuration)}</p>
                            <p><span className="font-bold">Duration:</span> {editDuration}m</p>
                            <p><span className="font-bold">Price:</span> ${editPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nail Art Section - Below main grid (Only show if Nail Art is selected) */}
                {editHasNailArt && (
                  <div className="mt-6 bg-gray-800 p-4 rounded-lg border-2 border-gray-700">
                    <h4 className="font-bold text-lg text-white mb-4">Nail Art Details (Optional)</h4>
                  
                  <div className="space-y-4">
                    {/* Nail Art Notes */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Nail Art Notes</label>
                      <textarea
                        value={editNailArtNotes}
                        onChange={(e) => setEditNailArtNotes(e.target.value)}
                        placeholder="Describe nail art design, style preferences, colors, patterns, or any special requests..."
                        className="w-full p-3 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-gray-600 text-sm text-white resize-none bg-gray-700"
                        rows={3}
                      />
                    </div>

                    {/* Nail Art Images */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-3">Inspiration Pictures</label>
                      
                      {/* File Upload Input */}
                      <div className="mb-4">
                        <label className="block">
                          <span className="text-xs font-semibold text-gray-400 mb-2 block">Upload New Pictures</span>
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
                            className="w-full p-2 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-gray-600 text-sm text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gray-700 file:text-gray-400 hover:file:bg-gray-600"
                          />
                        </label>
                      </div>

                      {/* Display existing images */}
                      {editNailArtImageUrls.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-400 mb-2">Current Images:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {editNailArtImageUrls.map((url, idx) => (
                              <div key={idx} className="relative group">
                                <img
                                  src={url}
                                  alt={`Nail art ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded border-2 border-gray-700 cursor-pointer"
                                  onClick={() => setSelectedImageUrl(url)}
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditNailArtImageUrls(editNailArtImageUrls.filter((_, i) => i !== idx))}
                                  className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition font-bold text-sm"
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
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 p-6 border-t-2 border-gray-700 bg-gray-800 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingBooking(null);
                    setSelectedAppointment(null);
                  }}
                  className="flex-1 py-3 px-4 border-2 border-gray-600 rounded-lg font-semibold text-white hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBooking}
                  className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-500 transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Appointment Modal */}
        {creatingAppointment && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setCreatingAppointment(false)}
          >
            <div 
              className="bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-gray-700 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gray-800 border-b-2 border-gray-700 p-6 flex items-center justify-between flex-shrink-0">
                <h4 className="font-bold text-xl text-white">Create New Appointment</h4>
                <button
                  onClick={() => setCreatingAppointment(false)}
                  className="text-gray-400 hover:text-gray-300 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form onSubmit={handleCreateAppointment} className="space-y-4" noValidate>
                  {createAptError && (
                    <div className="bg-red-900 border-2 border-red-700 p-3 rounded-lg text-red-200 text-sm">
                      {createAptError}
                    </div>
                  )}

                  {/* Customer Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Customer Name *</label>
                    <input
                      type="text"
                      value={newAptName}
                      onChange={(e) => setNewAptName(e.target.value)}
                      placeholder="Enter customer name"
                      className="w-full p-3 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-gray-600 text-white font-semibold text-sm bg-gray-800"
                    />
                  </div>

                  {/* Customer Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Phone Number (optional)</label>
                    <input
                      type="tel"
                      value={newAptPhone}
                      onChange={(e) => setNewAptPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full p-3 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-gray-600 text-white font-semibold text-sm bg-gray-800"
                    />
                  </div>

                  {/* Service Selection - Custom Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Base Service *</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setServiceDropdownOpen(!serviceDropdownOpen)}
                        className="w-full p-3 border-2 border-gray-700 rounded-lg text-white font-semibold text-sm bg-gray-800 hover:border-gray-600 transition text-left flex justify-between items-center"
                      >
                        <span>{newAptService ? BASE_SERVICES.find(s => s.id === newAptService)?.name : 'Select a service'}</span>
                        <span className="text-xs">▼</span>
                      </button>
                      {serviceDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-lg z-10">
                          <button
                            type="button"
                            onClick={() => {
                              setNewAptService('');
                              setServiceDropdownOpen(false);
                              handleServiceChange('');
                            }}
                            className="w-full px-3 py-2 text-left text-gray-300 hover:bg-gray-700 transition first:rounded-t-lg"
                          >
                            Select a service
                          </button>
                          {BASE_SERVICES.map((service) => (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => {
                                handleServiceChange(service.id);
                                setServiceDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left transition ${
                                newAptService === service.id
                                  ? 'bg-gray-700 text-white'
                                  : 'text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              {service.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optional Add-ons */}
                  {newAptService && (
                    <div className="bg-gray-800 p-4 rounded-lg border-2 border-gray-700 space-y-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Add-ons (optional)</p>

                      {/* Removal Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAptHasRemoval}
                          onChange={(e) => handleRemovalChange(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-300">Removal (+{REMOVAL_SERVICE.duration} min, +${REMOVAL_SERVICE.price})</span>
                      </label>

                      {/* Nail Art Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAptHasNailArt}
                          onChange={(e) => handleNailArtChange(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-300">Nail Art (+{NAIL_ART.durationAdd} min)</span>
                      </label>

                      {/* Design Checkbox (French or Ombre) */}
                      {newAptService && !['nail-art'].includes(newAptService) && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newAptHasDesign}
                            onChange={(e) => handleDesignChange(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-300">French or Ombre (+60 min, +$15)</span>
                        </label>
                      )}
                    </div>
                  )}

                  {/* Duration (Custom Dropdown, editable) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Duration (minutes)</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setDurationDropdownOpen(!durationDropdownOpen)}
                        className="w-full p-3 border-2 border-gray-700 rounded-lg text-white font-semibold text-sm bg-gray-800 hover:border-gray-600 transition text-left flex justify-between items-center"
                      >
                        <span>{newAptDuration} min</span>
                        <span className="text-xs">▼</span>
                      </button>
                      {durationDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                          {[60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270].map((duration) => (
                            <button
                              key={duration}
                              type="button"
                              onClick={() => {
                                setNewAptDuration(duration);
                                setDurationDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left transition ${
                                newAptDuration === duration
                                  ? 'bg-gray-700 text-white'
                                  : 'text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              {duration} min
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price (Read-only, auto-calculated unless Nail Art) */}
                  <div className="bg-gray-800 p-3 rounded-lg border-2 border-gray-700">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Total Price (auto-calculated)</p>
                    <p className="text-sm font-bold text-white">${newAptPrice.toFixed(2)}{newAptHasNailArt && '+'}</p>
                  </div>

                  {/* Date and Time Selection Calendar - After Duration Selection */}
                  {newAptDuration > 0 && (
                    <div className="bg-gray-800 p-4 rounded-lg border-2 border-gray-700">
                      <h4 className="font-bold text-lg text-white mb-4">Select Date & Time</h4>
                      <p className="text-xs text-gray-400 mb-4">Available slots for {newAptDuration} minutes</p>
                      <EditCalendar 
                        selectedDate={newAptDate}
                        onDateSelect={(date) => {
                          setNewAptDate(date);
                          setNewAptTime(''); // Clear time when date changes
                        }}
                        availableTimeSlotsMap={availableTimeSlotsMap}
                        selectedTime={newAptTime}
                        onTimeSelect={setNewAptTime}
                        durationMinutes={newAptDuration}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setCreatingAppointment(false)}
                      className="flex-1 py-3 px-4 border-2 border-gray-700 rounded-lg font-semibold text-white hover:bg-gray-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition"
                    >
                      Create Appointment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.show && deleteConfirmation.booking && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => !isDeleting && setDeleteConfirmation({ show: false, booking: null })}
          >
            <div 
              className="bg-gray-900 rounded-lg shadow-2xl max-w-md w-full border-2 border-red-700 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-red-900 p-6">
                <h3 className="text-xl font-bold text-white">Delete Appointment</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-gray-300">
                  Are you sure you want to delete the appointment for <span className="font-semibold text-white">{deleteConfirmation.booking.customer_name}</span>?
                </p>
                <div className="bg-gray-800 p-3 rounded-lg text-sm">
                  <p className="text-gray-400">Date: <span className="text-white">{new Date(`${deleteConfirmation.booking.booking_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></p>
                  <p className="text-gray-400">Time: <span className="text-white">{deleteConfirmation.booking.booking_time}</span></p>
                </div>
                <p className="text-red-400 text-sm font-semibold">This action cannot be undone.</p>
              </div>
              
              <div className="bg-gray-800 p-6 flex gap-3">
                <button
                  onClick={() => setDeleteConfirmation({ show: false, booking: null })}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 border-2 border-gray-600 rounded-lg font-semibold text-white hover:bg-gray-700 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteBooking}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-500 transition disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Preview Modal */}
        {confirmationPreview.show && confirmationPreview.booking && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => !isConfirming && setConfirmationPreview({ show: false, booking: null, tempPrice: 0 })}
          >
            <div 
              className="bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full border-2 border-gray-700 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gray-800 border-b-2 border-gray-700 p-6">
                <h3 className="text-2xl font-bold text-white">Confirm Appointment</h3>
                <p className="text-sm text-gray-400 mt-1">Review the details below and confirm to send SMS to customer</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Customer Name</p>
                    <p className="text-lg font-bold text-white">{confirmationPreview.booking.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Phone Number</p>
                    <p className="text-lg font-bold text-white">{confirmationPreview.booking.customer_phone}</p>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="bg-gray-800 p-4 rounded-lg border-2 border-gray-700">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Appointment Details</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date</span>
                      <span className="text-white font-semibold">
                        {new Date(`${confirmationPreview.booking.booking_date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time</span>
                      <span className="text-white font-semibold">
                        {format24to12Hour(confirmationPreview.booking.booking_time)} - {calculateEndTime(confirmationPreview.booking.booking_time, confirmationPreview.booking.duration)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration</span>
                      <span className="text-white font-semibold">{confirmationPreview.booking.duration} minutes</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-700">
                      <span className="text-gray-400">Service</span>
                      <span className="text-white font-semibold">{toReadableTitle(confirmationPreview.booking.service_id)}</span>
                    </div>
                    {confirmationPreview.booking.addons && confirmationPreview.booking.addons.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Add-ons</span>
                        <span className="text-white font-semibold">
                          {Array.isArray(confirmationPreview.booking.addons) ? confirmationPreview.booking.addons.map(toReadableTitle).join(', ') : confirmationPreview.booking.addons}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Section */}
                <div className="bg-green-900 bg-opacity-20 border-2 border-green-700 p-4 rounded-lg">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Final Price</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Adjust price if needed:</span>
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={confirmationPreview.tempPrice === 0 ? '' : confirmationPreview.tempPrice}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setConfirmationPreview({ ...confirmationPreview, tempPrice: 0 });
                        } else {
                          const parsed = parseFloat(value);
                          if (!isNaN(parsed)) {
                            setConfirmationPreview({ ...confirmationPreview, tempPrice: parsed });
                          }
                        }
                      }}
                      placeholder="0.00"
                      className="w-full p-3 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-green-600 text-white font-bold text-2xl bg-gray-800"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-6 border-t-2 border-gray-700 flex gap-3">
                <button
                  onClick={() => setConfirmationPreview({ show: false, booking: null, tempPrice: 0 })}
                  disabled={isConfirming}
                  className="flex-1 py-3 px-4 border-2 border-gray-700 rounded-lg font-semibold text-white hover:bg-gray-700 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!confirmationPreview.booking) return;
                    setIsConfirming(true);
                    try {
                      const response = await fetch('/api/appointments/confirm', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          appointmentId: confirmationPreview.booking.id,
                          finalPrice: confirmationPreview.tempPrice,
                        }),
                      });

                      if (response.ok) {
                        // Update booking status to confirmed
                        const updatedBooking: Booking = { ...confirmationPreview.booking, status: 'confirmed' };
                        setBookings(bookings.map(b => b.id === confirmationPreview.booking!.id ? updatedBooking : b));
                        setSaveMessage(`Confirmed ${confirmationPreview.booking.customer_name}'s appointment!`);
                        setConfirmationPreview({ show: false, booking: null, tempPrice: 0 });
                        setTimeout(() => setSaveMessage(''), 3000);
                      } else {
                        const errorData = await response.json();
                        alert(`Failed to confirm: ${errorData.error || 'Unknown error'}`);
                      }
                    } catch (error) {
                      console.error('Error confirming appointment:', error);
                      alert('An error occurred while confirming the appointment');
                    } finally {
                      setIsConfirming(false);
                    }
                  }}
                  disabled={isConfirming}
                  className="flex-1 py-3 px-4 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition disabled:opacity-50"
                >
                  {isConfirming ? 'Confirming...' : 'Confirm & Send SMS'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Appointment Rejection Modal */}
        {rejectionModal.show && rejectionModal.booking && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setRejectionModal({ show: false, booking: null, sendMessage: true })}
          >
            <div 
              className="bg-gray-900 rounded-lg shadow-2xl max-w-md w-full border-2 border-red-700 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-red-900 p-6">
                <h3 className="text-xl font-bold text-white">Reject Appointment</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-gray-300">
                  Are you sure you want to reject the appointment for <span className="font-semibold text-white">{rejectionModal.booking.customer_name}</span>?
                </p>
                <div className="bg-gray-800 p-3 rounded-lg text-sm space-y-2">
                  <p className="text-gray-400">Date: <span className="text-white">{new Date(`${rejectionModal.booking.booking_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></p>
                  <p className="text-gray-400">Time: <span className="text-white">{rejectionModal.booking.booking_time}</span></p>
                </div>

                {/* Send Message Checkbox */}
                <div className="border-t border-gray-700 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rejectionModal.sendMessage}
                      onChange={(e) => setRejectionModal({ ...rejectionModal, sendMessage: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-gray-600 bg-gray-800 cursor-pointer accent-blue-600"
                    />
                    <span className="text-gray-300">Send rejection text to customer</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2 ml-8">The customer will receive a message with a link to rebook</p>
                </div>

                <p className="text-red-400 text-sm font-semibold">This action cannot be undone. Calendar time slots will be freed.</p>
              </div>
              
              <div className="bg-gray-800 p-6 flex gap-3">
                <button
                  onClick={() => setRejectionModal({ show: false, booking: null, sendMessage: true })}
                  className="flex-1 py-3 px-4 border-2 border-gray-600 rounded-lg font-semibold text-white hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalRejectAppointment}
                  className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-500 transition"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <GalleryManagement />
        )}

      </div>
    </main>
  );
}
