import { NextRequest, NextResponse } from 'next/server';
import { sendAppointmentCancelledToTechnicianSMS } from '@/lib/sms-service';

// Lazy load Supabase to avoid build-time errors
async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}

// Get Supabase with service role key (bypasses RLS for trusted backend operations)
async function getSupabaseAdmin() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

const AVAILABLE_TIMES = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM',
];

// Helper function to get the next time slot based on duration and 15-minute buffer
function getBlockedTimesForAppointment(startTime: string, durationMinutes: number): string[] {
  const timeIndex = AVAILABLE_TIMES.indexOf(startTime);
  if (timeIndex === -1) return [];

  // Calculate how many 30-minute slots the appointment takes
  const totalMinutesWithBuffer = durationMinutes + 15; // Add 15-minute buffer
  const slotsNeeded = Math.ceil(totalMinutesWithBuffer / 30);

  const blockedTimes: string[] = [];
  for (let i = 0; i < slotsNeeded; i++) {
    if (timeIndex + i < AVAILABLE_TIMES.length) {
      blockedTimes.push(AVAILABLE_TIMES[timeIndex + i]);
    }
  }

  return blockedTimes;
}

interface CancelRequest {
  appointmentId: string;
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('appointmentId');

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointment ID' }, { status: 400 });
    }

    const supabaseAdmin = await getSupabaseAdmin();

    // Fetch the appointment
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Delete the appointment
    const { error: deleteError } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('id', appointmentId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
    }

    // Remove the blocked times associated with this appointment
    // Convert booking_time from 24-hour format (HH:MM:SS) to 12-hour format (H:MM AM/PM)
    const [hours, minutes] = appointment.booking_time.split(':').map(Number);
    let displayHours = hours;
    let period = 'AM';
    if (hours >= 12) {
      period = 'PM';
      if (hours > 12) displayHours = hours - 12;
    }
    if (hours === 0) displayHours = 12;

    const formattedTime = `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;

    const blockedTimesToRemove = getBlockedTimesForAppointment(formattedTime, appointment.duration);
    if (blockedTimesToRemove.length > 0) {
      await supabaseAdmin
        .from('blocked_times')
        .delete()
        .eq('date', appointment.booking_date)
        .in('time', blockedTimesToRemove);
    }

    // Send cancellation notification to Kinsey
    const technicianPhone = process.env.TECHNICIAN_PHONE_NUMBER;

    if (technicianPhone) {
      console.log('Sending cancellation notification SMS to Kinsey');
      try {
        const cancelSmsResult = await sendAppointmentCancelledToTechnicianSMS(
          technicianPhone,
          appointment.customer_name,
          appointment.booking_date,
          appointment.booking_time,
          appointment.service_id || 'Nail Service'
        );
        console.log('Cancellation SMS result:', cancelSmsResult);
      } catch (smsError) {
        console.error('Failed to send cancellation SMS:', smsError);
        // Don't fail the cancellation if SMS fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled. Kinsey has been notified.',
      appointmentId,
    });
  } catch (error) {
    console.error('Cancellation error:', error);
    return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 });
  }
}
