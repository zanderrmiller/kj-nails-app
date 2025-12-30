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
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('appointmentId');

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointment ID' }, { status: 400 });
    }

    const supabase = await getSupabase();

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
        service_id: appointment.service_id,
        duration: appointment.duration,
        total_price: appointment.total_price,
        status: appointment.status,
        addons: appointment.addons || [],
        nail_art_notes: appointment.nail_art_notes,
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
    const { appointmentId, finalPrice } = body;

    if (!appointmentId || finalPrice === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    // Update appointment status to confirmed and set final price
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'confirmed',
        total_price: finalPrice,
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to confirm appointment' }, { status: 500 });
    }

    console.log('Appointment confirmed:', appointmentId);

    // Send confirmation SMS to customer
    if (appointment.customer_phone) {
      console.log('Attempting to send confirmation SMS to customer:', appointment.customer_phone);
      try {
        const smsResult = await sendAppointmentConfirmedSMS(
          appointment.customer_phone,
          appointment.customer_name,
          appointment.booking_date,
          appointment.booking_time,
          finalPrice
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
      message: 'Appointment confirmed and customer notified',
      appointmentId: appointmentId,
    });
  } catch (error) {
    console.error('Confirmation error:', error);
    return NextResponse.json({ error: 'Failed to confirm appointment' }, { status: 500 });
  }
}
