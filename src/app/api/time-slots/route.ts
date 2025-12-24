import { getSupabase } from "@/lib/supabase";

const AVAILABLE_TIMES = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM',
];

// Convert 12-hour time to minutes since midnight
function timeToMinutes(time: string): number {
  const [timeStr, period] = time.split(' ');
  let [hours, minutes] = timeStr.split(':').map(Number);
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
}

// Convert minutes since midnight to 12-hour time
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  
  return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
}

// Get current time in Mountain Time
function getCurrentTimeInMountainTime(): Date {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const mtDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Denver' }));
  return mtDate;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // YYYY-MM-DD format

    if (!date) {
      return Response.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const availableTimes = [...AVAILABLE_TIMES];
    const unavailableTimes: { [key: string]: string } = {}; // time -> reason

    // Check if requested date is today
    const mtNow = getCurrentTimeInMountainTime();
    const today = mtNow.toISOString().split('T')[0];
    const isToday = date === today;

    if (isToday) {
      // Get current Mountain Time
      const currentMinutes = mtNow.getHours() * 60 + mtNow.getMinutes();
      const twoHoursLater = currentMinutes + 120; // 2 hours = 120 minutes

      // Grey out times within 2 hours from now
      availableTimes.forEach((time) => {
        const timeMinutes = timeToMinutes(time);
        if (timeMinutes <= twoHoursLater) {
          unavailableTimes[time] = 'Not enough advance notice';
        }
      });
    }

    // Fetch bookings for this date
    if (supabase) {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('booking_time, duration')
        .eq('booking_date', date)
        .eq('status', 'confirmed');

      if (!error && bookings) {
        // Mark times as unavailable if they're within a booking window
        bookings.forEach((booking: any) => {
          if (booking.booking_time && booking.duration) {
            // Parse booking time (format: HH:mm)
            const [hours, mins] = booking.booking_time.split(':').map(Number);
            const bookingStartMinutes = hours * 60 + mins;
            const bookingEndMinutes = bookingStartMinutes + booking.duration + 15; // +15 min buffer

            availableTimes.forEach((time) => {
              const timeMinutes = timeToMinutes(time);
              // Check if this time slot overlaps with booking window
              // Time slot is 30 minutes long
              if (timeMinutes < bookingEndMinutes && timeMinutes + 30 > bookingStartMinutes) {
                unavailableTimes[time] = 'Already booked';
              }
            });
          }
        });
      }
    }

    return Response.json({
      success: true,
      date: date,
      availableTimes: availableTimes.filter((t) => !unavailableTimes[t]),
      unavailableTimes: unavailableTimes,
      allTimes: availableTimes.map((t) => ({
        time: t,
        available: !unavailableTimes[t],
        reason: unavailableTimes[t] || null,
      })),
    });
  } catch (error) {
    console.error('Time slots API error:', error);
    return Response.json(
      {
        error: 'Failed to fetch time slots',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
