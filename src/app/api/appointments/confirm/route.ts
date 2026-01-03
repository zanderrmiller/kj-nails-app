import { NextRequest, NextResponse } from 'next/server';
import { sendAppointmentConfirmedSMS } from '@/lib/sms-service';

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

interface ConfirmationRequest {
  appointmentId: string;
  finalPrice: number;
  duration?: number;
  sendSms?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let appointmentId = searchParams.get('appointmentId');

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointment ID' }, { status: 400 });
    }

    const supabase = await getSupabase();

    // Check if appointmentId is a short code (8 chars or less, alphanumeric)
    if (appointmentId.length <= 8 && /^[a-zA-Z0-9]+$/.test(appointmentId)) {
      // Look up the full appointment ID from the short code
      const { data: shortCodeData, error: shortCodeError } = await supabase
        .from('short_codes')
        .select('appointment_id')
        .eq('code', appointmentId)
        .single();

      if (shortCodeError || !shortCodeData) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      }

      appointmentId = shortCodeData.appointment_id;
    }

    // Fetch appointment details
    const { data: appointment, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        customer_name: appointment.customer_name,
        customer_phone: appointment.customer_phone,
        booking_date: appointment.booking_date,
        booking_time: appointment.booking_time,
        previous_booking_date: appointment.previous_booking_date || null,
        previous_booking_time: appointment.previous_booking_time || null,
        was_edited: appointment.was_edited || false,
        service_id: appointment.service_id,
        duration: appointment.duration,
        total_price: appointment.total_price,
        status: appointment.status,
        addons: appointment.addons || [],
        nail_art_notes: appointment.nail_art_notes,
        nail_art_image_urls: appointment.nail_art_image_urls || [],
      },
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ConfirmationRequest = await request.json();
    let { appointmentId, finalPrice, duration, sendSms = true } = body;

    if (!appointmentId || finalPrice === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await getSupabaseAdmin();

    // Check if appointmentId is a short code (8 chars or less, alphanumeric)
    if (appointmentId.length <= 8 && /^[a-zA-Z0-9]+$/.test(appointmentId)) {
      // Look up the full appointment ID from the short code
      const { data: shortCodeData, error: shortCodeError } = await supabase
        .from('short_codes')
        .select('appointment_id')
        .eq('code', appointmentId)
        .single();

      if (shortCodeError || !shortCodeData) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      }

      appointmentId = shortCodeData.appointment_id;
    }

    // Fetch the appointment
    const { data: appointment, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Update appointment status to confirmed and set final price (and duration if changed)
    const updateData: any = {
      status: 'confirmed',
      total_price: finalPrice,
    };
    
    if (duration !== undefined) {
      updateData.duration = duration;
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to confirm appointment' }, { status: 500 });
    }

    console.log('Appointment confirmed:', appointmentId);

    // Send confirmation SMS to customer (if enabled)
    if (sendSms && appointment.customer_phone) {
      console.log('Attempting to send confirmation SMS to customer:', appointment.customer_phone);
      try {
        const smsResult = await sendAppointmentConfirmedSMS(
          appointment.customer_phone,
          appointment.customer_name,
          appointment.booking_date,
          appointment.booking_time,
          finalPrice,
          appointmentId
        );
        console.log('Confirmation SMS result:', smsResult);
        if (smsResult.success) {
          console.log('✅ Confirmation SMS sent successfully');
        } else {
          console.error('❌ Confirmation SMS failed:', smsResult.error);
        }
      } catch (smsError) {
        console.error('Failed to send confirmation SMS:', smsError);
        // Don't fail the confirmation if SMS fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment confirmed' + (sendSms ? ' and customer notified' : ''),
      appointmentId: appointmentId,
    });
  } catch (error) {
    console.error('Confirmation error:', error);
    return NextResponse.json({ error: 'Failed to confirm appointment' }, { status: 500 });
  }
}
