import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const AVAILABLE_TIMES = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM',
];

export async function GET() {
  try {
    const supabase = getSupabase();
    
    // Helper function to format date as YYYY-MM-DD in Mountain Time
    const formatDateMountainTime = (date: Date): string => {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Denver',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(date);
    };
    
    // Get today's date in Mountain Time (not UTC)
    const todayDate = new Date();
    const todayStr = formatDateMountainTime(todayDate);
    
    const dates: { [date: string]: Array<{ time: string; available: boolean; reason: string | null }> } = {};

    // Get all 60 dates
    const allDates: string[] = [];
    for (let i = 0; i < 60; i++) {
      const date = new Date(todayDate);
      date.setDate(date.getDate() + i);
      allDates.push(formatDateMountainTime(date));
    }

    // Initialize all dates with all times available
    allDates.forEach((dateStr) => {
      dates[dateStr] = AVAILABLE_TIMES.map((time) => ({
        time,
        available: true,
        reason: null,
      }));
    });

    if (!supabase) {
      // No database - return all times available
      return NextResponse.json({ success: true, dates });
    }

    // Get current time in Mountain Time
    const now = new Date();
    const mountainTimeStr = now.toLocaleString('en-US', { timeZone: 'America/Denver' });
    const mountainTime = new Date(mountainTimeStr);

    // Fetch blocked dates
    const { data: blockedDatesData } = await supabase
      .from('availability_blocks')
      .select('date')
      .eq('reason', 'blocked')
      .in('date', allDates);

    const blockedDates = new Set((blockedDatesData || []).map((d: any) => d.date));

    // Fetch blocked times for all dates
    const { data: blockedTimesData } = await supabase
      .from('blocked_times')
      .select('date, time')
      .in('date', allDates);

    const blockedTimes = new Map<string, Set<string>>();
    (blockedTimesData || []).forEach((bt: any) => {
      if (!blockedTimes.has(bt.date)) {
        blockedTimes.set(bt.date, new Set());
      }
      blockedTimes.get(bt.date)!.add(bt.time);
    });

    // Fetch bookings for all dates
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('booking_date, booking_time, duration')
      .in('booking_date', allDates)
      .eq('status', 'pending');

    const bookings = new Map<string, Array<{ time: string; duration: number }>>();
    (bookingsData || []).forEach((b: any) => {
      if (!bookings.has(b.booking_date)) {
        bookings.set(b.booking_date, []);
      }
      bookings.get(b.booking_date)!.push({
        time: b.booking_time,
        duration: b.duration,
      });
    });

    // Process each date
    allDates.forEach((dateStr) => {
      const dateObj = new Date(dateStr + 'T00:00:00');
      const isToday = dateStr === todayStr;

      // Check if entire day is blocked
      if (blockedDates.has(dateStr)) {
        dates[dateStr] = AVAILABLE_TIMES.map((time) => ({
          time,
          available: false,
          reason: 'Day is blocked',
        }));
        return;
      }

      // Process each time slot
      dates[dateStr] = AVAILABLE_TIMES.map((time) => {
        // Check if time is individually blocked
        if (blockedTimes.get(dateStr)?.has(time)) {
          return { time, available: false, reason: 'Time is blocked' };
        }

        // Check 2-hour advance notice on current day
        if (isToday) {
          const [timeStr, period] = time.split(' ');
          const [hours, minutes] = timeStr.split(':').map(Number);
          let hour = hours;
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;

          const slotTime = new Date(mountainTime);
          slotTime.setHours(hour, minutes, 0, 0);

          const twoHoursFromNow = new Date(mountainTime.getTime() + 2 * 60 * 60 * 1000);

          if (slotTime < twoHoursFromNow) {
            return {
              time,
              available: false,
              reason: '2-hour advance notice required',
            };
          }
        }

        // Check for booking conflicts
        const bookingsOnDate = bookings.get(dateStr) || [];
        const hasConflict = bookingsOnDate.some((booking) => {
          // Parse booking time with AM/PM
          const [bookTimeStr, bookPeriod] = booking.time.split(' ');
          const [bookHours, bookMinutes] = bookTimeStr.split(':').map(Number);
          let bookHour = bookHours;
          if (bookPeriod === 'PM' && bookHour !== 12) bookHour += 12;
          if (bookPeriod === 'AM' && bookHour === 12) bookHour = 0;

          const bookingStart = new Date(dateObj);
          bookingStart.setHours(bookHour, bookMinutes, 0);
          const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60 * 1000 + 15 * 60 * 1000); // +15min buffer

          // Parse slot time with AM/PM
          const [slotTimeStr, slotPeriod] = time.split(' ');
          const [slotHours, slotMinutes] = slotTimeStr.split(':').map(Number);
          let slotHour = slotHours;
          if (slotPeriod === 'PM' && slotHour !== 12) slotHour += 12;
          if (slotPeriod === 'AM' && slotHour === 12) slotHour = 0;

          const slotStart = new Date(dateObj);
          slotStart.setHours(slotHour, slotMinutes, 0);

          return slotStart >= bookingStart && slotStart < bookingEnd;
        });

        if (hasConflict) {
          return { time, available: false, reason: 'Already booked' };
        }

        return { time, available: true, reason: null };
      });
    });

    return NextResponse.json({ success: true, dates });
  } catch (error) {
    console.error('Error fetching 60-day availability:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch availability' }, { status: 500 });
  }
}
