import { NextRequest, NextResponse } from 'next/server';
import { sendAppointmentReminderWithLinkSMS } from '@/lib/sms-service';

// Lazy load Supabase to avoid build-time errors
async function getSupabaseAdmin() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Vercel's cron (Vercel uses a specific header)
    // or from an authorized source with the CRON_SECRET
    const authHeader = request.headers.get('authorization');
    const veracelCronHeader = request.headers.get('x-vercel-cron');
    
    // Allow if it's from Vercel's cron system OR has the correct secret
    const isVercelCron = veracelCronHeader === 'true';
    const hasValidSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    
    if (!isVercelCron && !hasValidSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = await getSupabaseAdmin();

    // Get current time
    const now = new Date();
    
    // Find appointments scheduled for approximately 24 hours from now
    // We check a 2-hour window (23-25 hours) to catch appointments even if cron timing varies
    const reminderWindowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23 hours
    const reminderWindowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours
    
    // Format dates for database comparison (YYYY-MM-DD)
    const startDateStr = reminderWindowStart.toISOString().split('T')[0];
    const endDateStr = reminderWindowEnd.toISOString().split('T')[0];

    console.log(`[${new Date().toISOString()}] Checking for appointments between 23-25 hours away`);
    console.log(`  Start window: ${reminderWindowStart.toISOString()}`);
    console.log(`  End window: ${reminderWindowEnd.toISOString()}`);

    // Fetch confirmed appointments that need reminders (not yet sent)
    // Note: We check appointments across a 2-hour window because the exact time
    // depends on when the appointment was scheduled, so checking a wider window
    // ensures we catch all appointments ~24 hours away
    const { data: appointments, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('status', 'confirmed')
      .eq('reminder_sent', false)
      .gte('booking_date', startDateStr)
      .lte('booking_date', endDateStr);

    if (fetchError) {
      console.error('Error fetching appointments:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }

    // Filter to only appointments at allowed start times (9 AM, 12 PM, 3 PM, 6 PM)
    const allowedStartTimes = ['09:00', '12:00', '15:00', '18:00'];
    const filteredAppointments = (appointments || []).filter((apt) => {
      const startHour = apt.booking_time?.substring(0, 5); // Extract HH:MM
      return allowedStartTimes.includes(startHour);
    });

    console.log(`Found ${filteredAppointments.length} appointments for reminders (filtered for 9 AM, 12 PM, 3 PM, 6 PM start times)`);

    if (filteredAppointments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No appointments found for reminders at allowed start times',
        remindersSent: 0,
      });
    }

    let remindersSent = 0;
    const remindersToUpdate = [];

    // Send reminders for each appointment
    for (const appointment of filteredAppointments) {
      try {
        // Get short code for reschedule/cancel link
        let shortCode = '';
        try {
          const { data } = await supabaseAdmin
            .from('short_codes')
            .select('code')
            .eq('appointment_id', appointment.id)
            .single();

          shortCode = data?.code || '';
        } catch (error) {
          console.error('Error getting short code:', error);
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kj-nails-app.vercel.app';
        const appointmentUrl = shortCode ? `${baseUrl}/a/${shortCode}` : '';

        // Send reminder SMS
        const smsResult = await sendAppointmentReminderWithLinkSMS(
          appointment.customer_phone,
          appointment.customer_name,
          appointment.booking_date,
          appointment.booking_time,
          appointmentUrl
        );

        if (smsResult.success) {
          remindersSent++;
          remindersToUpdate.push(appointment.id);
          console.log(`✅ Reminder sent to ${appointment.customer_name}`);
        } else {
          console.error(`❌ Failed to send reminder to ${appointment.customer_name}:`, smsResult.error);
        }
      } catch (error) {
        console.error(`Error sending reminder for appointment ${appointment.id}:`, error);
      }
    }

    // Mark reminders as sent
    if (remindersToUpdate.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ reminder_sent: true })
        .in('id', remindersToUpdate);

      if (updateError) {
        console.error('Error updating reminder status:', updateError);
        // Don't fail the request, just log it
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${remindersSent} appointment reminders`,
      remindersSent,
    });
  } catch (error) {
    console.error('Reminder job error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send reminders' },
      { status: 500 }
    );
  }
}
