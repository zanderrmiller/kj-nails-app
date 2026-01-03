import { NextRequest, NextResponse } from 'next/server';
import { sendAppointmentEditedSMS, sendAppointmentRescheduledCustomerSMS } from '@/lib/sms-service';

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

interface EditRequest {
  appointmentId: string;
  newDate?: string;
  newTime?: string;
  nailArtNotes?: string;
}

export async function PUT(request: NextRequest) {
  try {
    const body: EditRequest = await request.json();
    const { appointmentId, newDate, newTime, nailArtNotes } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointment ID' }, { status: 400 });
    }

    const supabaseAdmin = await getSupabaseAdmin();

    // Fetch the current appointment
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Only allow edits to pending appointments
    if (appointment.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending appointments can be edited' },
        { status: 400 }
      );
    }

    // Determine what changed
    const dateChanged = newDate && newDate !== appointment.booking_date;
    const timeChanged = newTime && newTime !== appointment.booking_time;

    // Update the appointment
    const updateData: any = {
      status: 'pending', // Reset to pending for new confirmation
    };

    if (newDate) updateData.booking_date = newDate;
    if (newTime) updateData.booking_time = newTime;
    if (nailArtNotes !== undefined) updateData.nail_art_notes = nailArtNotes;

    // Store previous booking details when editing
    if (dateChanged || timeChanged) {
      updateData.previous_booking_date = appointment.booking_date;
      updateData.previous_booking_time = appointment.booking_time;
      updateData.was_edited = true;
    }

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
    }

    // If date/time changed, update blocked times
    if (dateChanged || timeChanged) {
      const updatedDate = newDate || appointment.booking_date;
      const updatedTime = newTime || appointment.booking_time;

      // Remove old blocked times
      await supabaseAdmin
        .from('blocked_times')
        .delete()
        .eq('date', appointment.booking_date)
        .in('time', getBlockedTimesForAppointment(appointment.booking_time, appointment.duration));

      // Add new blocked times
      const newBlockedTimes = getBlockedTimesForAppointment(updatedTime, appointment.duration);
      if (newBlockedTimes.length > 0) {
        const blockedTimeRecords = newBlockedTimes.map((time) => ({
          date: updatedDate,
          time,
        }));

        await supabaseAdmin.from('blocked_times').insert(blockedTimeRecords as any);
      }
    }

    // Send notification to Kinsey
    const technicianPhone = process.env.TECHNICIAN_PHONE_NUMBER;
    const adminPageUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (technicianPhone) {
      console.log('Sending edit notification SMS to Kinsey');
      try {
        const pendingConfirmationsLink = `${adminPageUrl}/pending`;
        const editSmsResult = await sendAppointmentEditedSMS(
          technicianPhone,
          appointment.customer_name,
          newDate || appointment.booking_date,
          newTime || appointment.booking_time,
          appointment.service_id || 'Nail Service',
          pendingConfirmationsLink,
          appointment.duration
        );
        console.log('Edit notification SMS result:', editSmsResult);
      } catch (smsError) {
        console.error('Failed to send edit notification SMS:', smsError);
        // Don't fail the edit if SMS fails
      }
    }

    // Send confirmation SMS to customer with new appointment details
    const customerPhone = appointment.customer_phone;
    if (customerPhone) {
      console.log('Sending rescheduled appointment SMS to customer');
      try {
        const customerSmsResult = await sendAppointmentRescheduledCustomerSMS(
          customerPhone,
          appointment.customer_name,
          newDate || appointment.booking_date,
          newTime || appointment.booking_time,
          appointment.service_id || 'Nail Service',
          appointment.total_price || 0,
          appointmentId
        );
        console.log('Customer reschedule SMS result:', customerSmsResult);
      } catch (smsError) {
        console.error('Failed to send customer reschedule SMS:', smsError);
        // Don't fail the edit if SMS fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment updated. Kinsey has been notified for re-confirmation.',
      appointmentId,
    });
  } catch (error) {
    console.error('Edit error:', error);
    return NextResponse.json({ error: 'Failed to edit appointment' }, { status: 500 });
  }
}
