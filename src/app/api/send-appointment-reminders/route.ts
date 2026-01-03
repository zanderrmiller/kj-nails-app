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
    // Verify the request has the correct authorization header (optional security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = await getSupabaseAdmin();

    // Calculate times for 24 hours from now
    const now = new Date();
    const tomorrowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23 hours from now
    const tomorrowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours from now

    // Format dates for comparison (YYYY-MM-DD)
    const tomorrowStartStr = tomorrowStart.toISOString().split('T')[0];
    const tomorrowEndStr = tomorrowEnd.toISOString().split('T')[0];

    console.log(`Checking for appointments between ${tomorrowStart} and ${tomorrowEnd}`);

    // Fetch confirmed appointments for tomorrow that haven't had reminders sent
    const { data: appointments, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('status', 'confirmed')
      .eq('reminder_sent', false)
      .gte('booking_date', tomorrowStartStr)
      .lte('booking_date', tomorrowEndStr);

    if (fetchError) {
      console.error('Error fetching appointments:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }

    console.log(`Found ${appointments?.length || 0} appointments for reminders`);

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No appointments found for reminders',
        remindersSent: 0,
      });
    }

    let remindersSent = 0;
    const remindersToUpdate = [];

    // Send reminders for each appointment
    for (const appointment of appointments) {
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
