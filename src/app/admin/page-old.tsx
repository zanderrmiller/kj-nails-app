'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const AVAILABLE_TIMES = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM',
];

// Calendar component for admin
function AdminCalendar({ 
  blockedDates, 
  onDateSelect, 
  selectedDate 
}: { 
  blockedDates: Set<string>;
  onDateSelect: (date: string) => void;
  selectedDate: string;
}) {
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
  const canGoNext = displayMonth < 2;

  return (
    <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
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
      
      <div className="grid grid-cols-7 gap-2 mb-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-semibold text-gray-600 text-sm">
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
          const isSelected = selectedDate === dateString;
          const isBlocked = blockedDates.has(dateString);
          
          return (
            <button
              key={day}
              type="button"
              onClick={() => onDateSelect(dateString)}
              className={`p-2 rounded-lg font-semibold text-sm transition w-full h-10 flex items-center justify-center ${
                isSelected
                  ? 'bg-pink-600 text-white border-2 border-pink-600'
                  : isBlocked
                  ? 'bg-red-100 text-red-700 border-2 border-red-300 cursor-pointer'
                  : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50 cursor-pointer'
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

export default function AdminPage() {
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState('');
  const [blockedTimes, setBlockedTimes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'blocking' | 'bookings'>('blocking');
  const [bookings, setBookings] = useState<any[]>([]);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [editTime, setEditTime] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDuration, setEditDuration] = useState(0);

  // Load blocked dates and bookings on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [blockedResponse, bookingsResponse] = await Promise.all([
          fetch('/api/blocked-dates'),
          fetch('/api/bookings'),
        ]);

        const blockedData = await blockedResponse.json();
        if (blockedData.success && blockedData.blockedDates) {
          setBlockedDates(new Set(blockedData.blockedDates));
        }

        const bookingsData = await bookingsResponse.json();
        if (bookingsData.success && bookingsData.bookings) {
          setBookings(bookingsData.bookings);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const toggleBlockDate = async (date: string) => {
    const newBlocked = new Set(blockedDates);
    
    if (newBlocked.has(date)) {
      newBlocked.delete(date);
    } else {
      newBlocked.add(date);
    }
    
    setBlockedDates(newBlocked);

    try {
      const response = await fetch('/api/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          blocked: newBlocked.has(date),
        }),
      });

      if (response.ok) {
        setSaveMessage('Date blocked status updated');
        setTimeout(() => setSaveMessage(''), 2000);
      }
    } catch (error) {
      console.error('Failed to update blocked date:', error);
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
      }
    } catch (error) {
      console.error('Failed to update blocked time:', error);
    }
  };

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

  const handleEditBooking = (booking: any) => {
    setEditingBooking(booking);
    setEditDate(booking.booking_date);
    setEditTime(booking.booking_time);
    setEditDuration(booking.duration);
  };

  const handleSaveBooking = async () => {
    if (!editingBooking) return;

    try {
      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: editingBooking.id,
          date: editDate,
          time: editTime,
          duration: editDuration,
        }),
      });

      if (response.ok) {
        // Update bookings list
        setBookings(
          bookings.map((b) =>
            b.id === editingBooking.id
              ? { ...b, booking_date: editDate, booking_time: editTime, duration: editDuration }
              : b
          )
        );
        setEditingBooking(null);
        setSaveMessage('Appointment updated successfully');
        setTimeout(() => setSaveMessage(''), 2000);
      } else {
        alert('Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('An error occurred while updating the appointment');
    }
  };

  const handleDeleteBooking = async (booking: any) => {
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
        
        // Refresh blocked dates to reflect changes
        const blockedResponse = await fetch('/api/blocked-dates');
        const blockedData = await blockedResponse.json();
        if (blockedData.success && blockedData.blockedDates) {
          setBlockedDates(new Set(blockedData.blockedDates));
        }
        
        setSaveMessage('Appointment deleted successfully');
        setTimeout(() => setSaveMessage(''), 2000);
      } else {
        alert(`Failed to delete appointment: ${responseData.error || 'Unknown error'}`);
        console.error('Delete response:', responseData);
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
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
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

      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center">Admin Dashboard</h1>

        {saveMessage && (
          <div className="mb-6 p-4 bg-green-100 border-2 border-green-300 text-green-700 rounded-lg text-center">
            {saveMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab('blocking')}
            className={`py-2 px-4 font-semibold transition ${
              activeTab === 'blocking'
                ? 'text-pink-600 border-b-2 border-pink-600 -mb-0.5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Block Dates & Times
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-2 px-4 font-semibold transition ${
              activeTab === 'bookings'
                ? 'text-pink-600 border-b-2 border-pink-600 -mb-0.5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Appointments ({bookings.length})
          </button>
        </div>

        {/* Blocking Tab */}
        {activeTab === 'blocking' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Block Dates & Times</h2>
              <AdminCalendar 
                blockedDates={blockedDates}
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate}
              />
            </div>

            {/* Block Controls */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 h-fit">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'Select a Date'}
              </h3>

              {selectedDate && (
                <>
                  <div className="mb-6 space-y-3">
                    <button
                      onClick={blockEntireDay}
                      className={`w-full py-2 px-4 rounded-lg font-semibold transition ${
                        blockedDates.has(selectedDate)
                          ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                      }`}
                      disabled={blockedDates.has(selectedDate)}
                    >
                      Block Entire Day
                    </button>
                    
                    {blockedDates.has(selectedDate) && (
                      <button
                        onClick={unblockEntireDay}
                        className="w-full py-2 px-4 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition cursor-pointer"
                      >
                        Unblock Entire Day
                      </button>
                    )}
                  </div>

                  <div className="border-t-2 border-gray-200 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Block Individual Times</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {AVAILABLE_TIMES.map((time) => (
                        <label
                          key={time}
                          className="flex items-center p-2 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                        >
                          <input
                            type="checkbox"
                            checked={blockedTimes.has(time)}
                            onChange={() => toggleBlockTime(time)}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">{time}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!selectedDate && (
                <p className="text-center text-gray-500 text-sm">Select a date on the calendar to manage blocking</p>
              )}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Appointments</h2>

            {bookings.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No appointments yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Name</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Phone</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Service</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Date</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Time</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Duration</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Price</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-2 text-gray-900">{booking.customer_name}</td>
                        <td className="py-3 px-2 text-gray-900">{booking.customer_phone}</td>
                        <td className="py-3 px-2 text-gray-900">{booking.service_id}</td>
                        <td className="py-3 px-2 text-gray-900">{booking.booking_date}</td>
                        <td className="py-3 px-2 text-gray-900">{booking.booking_time}</td>
                        <td className="py-3 px-2 text-gray-900">{booking.duration}m</td>
                        <td className="py-3 px-2 text-gray-900">${parseFloat(booking.total_price).toFixed(2)}</td>
                        <td className="py-3 px-2 space-x-2 flex">
                          <button
                            onClick={() => handleEditBooking(booking)}
                            className="text-pink-600 hover:text-pink-700 font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBooking(booking)}
                            className="text-red-600 hover:text-red-700 font-semibold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Edit Modal */}
            {editingBooking && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit Appointment</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Name</label>
                      <input
                        type="text"
                        value={editingBooking.customer_name}
                        disabled
                        className="w-full p-2 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Date</label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full p-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-pink-600 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Time</label>
                      <select
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="w-full p-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-pink-600 text-gray-900"
                      >
                        {AVAILABLE_TIMES.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Duration (minutes)</label>
                      <input
                        type="number"
                        value={editDuration}
                        onChange={(e) => setEditDuration(parseInt(e.target.value) || 0)}
                        min="15"
                        step="15"
                        className="w-full p-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-pink-600 text-gray-900"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setEditingBooking(null)}
                        className="flex-1 py-2 px-4 border-2 border-gray-300 rounded-lg font-semibold text-gray-900 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBooking}
                        className="flex-1 py-2 px-4 bg-pink-600 rounded-lg font-semibold text-white hover:bg-pink-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        {activeTab === 'blocking' && (
          <div className="mt-8 bg-white rounded-lg p-4 sm:p-6 border-2 border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white border-2 border-gray-200 rounded"></div>
                <span className="text-sm text-gray-600">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 border-2 border-red-300 rounded"></div>
                <span className="text-sm text-gray-600">Has Blocked Times</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-pink-600 border-2 border-pink-600 rounded"></div>
                <span className="text-sm text-gray-600">Selected</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
