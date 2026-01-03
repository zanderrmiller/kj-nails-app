import { NextRequest, NextResponse } from 'next/server';
import { sendAppointmentBookedSMS, sendAppointmentBookedToTechnicianSMS, sendAppointmentCancelledToTechnicianSMS } from '@/lib/sms-service';
import { performFraudChecks } from '@/lib/fraud-protection';
import { createShortCode } from '@/lib/short-codes';

const AVAILABLE_TIMES = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM',
];

interface BookingRequest {
  baseService: {
    id: string;
    name: string;
    duration: number;
    basePrice: number;
  };
  addons: Array<{ id: string; name: string; price: number; duration: number }>;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  totalPrice: number;
  totalDuration: number;
  nailArtNotes?: string;
  nailArtImagesCount?: number;
  nailArtImageUrls?: string[];
}

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

export async function POST(request: NextRequest) {
  try {
    let body: BookingRequest;
    
    try {
      const text = await request.text();
      if (!text) {
        return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    console.log('=== BOOKING REQUEST DEBUG ===');
    console.log('Body received:', JSON.stringify(body, null, 2));
    console.log('Customer phone:', body.customerPhone);
    console.log('Customer name:', body.customerName);

    // Validate required fields (phone can be empty string for admin-created bookings)
    if (!body.date || !body.time || !body.baseService || !body.customerName) {
     

    // ✅ FRAUD PROTECTION: Run all backend security checks
    // These are completely transparent to legitimate users
    const fraudCheck = performFraudChecks(request, body.customerName, body.customerPhone);
    if (!fraudCheck.allowed) {
      console.warn('❌ Booking rejected by fraud protection:', fraudCheck.error);
      return NextResponse.json({ error: fraudCheck.error }, { status: 429 });
    } return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await getSupabase();

    // Save booking to database
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        customer_name: body.customerName,
        customer_phone: body.customerPhone,
        service_id: body.baseService.id,
        booking_date: body.date,
        booking_time: body.time,
        duration: body.totalDuration,
        addons: body.addons.map((a) => a.id),
        total_price: body.totalPrice,
        status: 'pending',
        nail_art_notes: body.nailArtNotes || null,
        nail_art_images_count: body.nailArtImagesCount || 0,
        nail_art_image_urls: body.nailArtImageUrls || [],
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Database error:', bookingError);
      return NextResponse.json({ error: 'Failed to save booking' }, { status: 500 });
    }

    // Block the times for this appointment (duration + 15-minute buffer, rounded to next time slot)
    const blockedTimes = getBlockedTimesForAppointment(body.time, body.totalDuration);
    
    if (blockedTimes.length > 0) {
      const blockedTimeRecords = blockedTimes.map((time) => ({
        date: body.date,
        time,
      }));

      const { error: blockError } = await supabase.from('blocked_times').insert(blockedTimeRecords);

      if (blockError && !blockError.message.includes('duplicate')) {
        console.error('Error blocking times:', blockError);
        // Don't fail the booking if blocking times fails
      }
    }

    console.log('Booking created:', booking);

    // Create short code for the appointment
    const shortCode = await createShortCode(booking.id);
    console.log('Short code created:', shortCode);

    // Send SMS notification to customer
    console.log('=== SMS SENDING DEBUG ===');
    console.log('booking.customer_phone:', booking.customer_phone);
    console.log('booking.customer_phone truthy?:', !!booking.customer_phone);
    
    if (booking.customer_phone) {
      console.log('Attempting to send SMS to:', booking.customer_phone);
      try {
        const smsResult = await sendAppointmentBookedSMS(
          booking.customer_phone,
          booking.customer_name,
          booking.booking_date,
          booking.booking_time,
          body.baseService?.name || 'Nail Service',
          body.baseService?.basePrice || 0,
          booking.id
        );
        console.log('SMS result:', smsResult);
        if (smsResult.success) {
          console.log('✅ SMS sent successfully');
        } else {
          console.error('❌ SMS failed:', smsResult.error);
        }
      } catch (smsError) {
        console.error('Failed to send booking confirmation SMS:', smsError);
        // Don't fail the booking if SMS fails
      }
    } else {
      console.log('⚠️ No customer phone number provided, skipping SMS');
    }

    // Send SMS notification to Kinsey (technician)
    const technicianPhone = process.env.TECHNICIAN_PHONE_NUMBER;
    if (technicianPhone) {
      console.log('Sending new appointment notification to technician');
      try {
        const technicianSmsResult = await sendAppointmentBookedToTechnicianSMS(
          technicianPhone,
          booking.customer_name,
          booking.booking_date,
          booking.booking_time,
          body.baseService?.name || 'Nail Service',
          body.totalDuration
        );
        console.log('Technician SMS result:', technicianSmsResult);
      } catch (smsError) {
        console.error('Failed to send technician booking SMS:', smsError);
        // Don't fail the booking if SMS fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Booking confirmed. Your appointment has been scheduled.',
        bookingId: booking.id,
        booking: booking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabase();

    // Fetch all bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      bookings: bookings || [],
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, time, date, duration, total_price, customer_name, customer_phone, service_id, nail_art_notes, admin_notes, nail_art_image_urls } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    const supabase = await getSupabaseAdmin();

    // Get the current booking
    const { data: currentBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !currentBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const newDate = date || currentBooking.booking_date;
    const newTime = time || currentBooking.booking_time;
    const newDuration = duration || currentBooking.duration;
    const newPrice = total_price !== undefined ? total_price : currentBooking.total_price;
    const newName = customer_name || currentBooking.customer_name;
    const newPhone = customer_phone || currentBooking.customer_phone;
    const newServiceId = service_id || currentBooking.service_id;
    const newNailArtNotes = nail_art_notes !== undefined ? nail_art_notes : currentBooking.nail_art_notes;
    const newAdminNotes = admin_notes !== undefined ? admin_notes : currentBooking.admin_notes;
    const newNailArtImageUrls = nail_art_image_urls !== undefined ? nail_art_image_urls : currentBooking.nail_art_image_urls;

    // Update the booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        booking_date: newDate,
        booking_time: newTime,
        duration: newDuration,
        total_price: newPrice,
        customer_name: newName,
        customer_phone: newPhone,
        service_id: newServiceId,
        nail_art_notes: newNailArtNotes,
        admin_notes: newAdminNotes,
        nail_art_image_urls: newNailArtImageUrls,
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // Remove old blocked times
    await supabase
      .from('blocked_times')
      .delete()
      .eq('date', currentBooking.booking_date)
      .in('time', getBlockedTimesForAppointment(currentBooking.booking_time, currentBooking.duration));

    // Add new blocked times with updated duration
    const newBlockedTimes = getBlockedTimesForAppointment(newTime, newDuration);
    if (newBlockedTimes.length > 0) {
      const blockedTimeRecords = newBlockedTimes.map((t) => ({
        date: newDate,
        time: t,
      }));

      await supabase.from('blocked_times').insert(blockedTimeRecords as any);
    }

    return NextResponse.json({
      success: true,
      message: 'Booking updated',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    // Use service role key for admin operations (bypasses RLS)
    const supabase = await getSupabaseAdmin();

    // Get the booking to retrieve its date, time, and duration for cleanup
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Delete nail art images from storage if they exist
    if (booking.nail_art_image_urls && Array.isArray(booking.nail_art_image_urls) && booking.nail_art_image_urls.length > 0) {
      try {
        // Extract file paths from URLs (format: https://...storage.../object/public/nail-art-uploads/BOOKING_ID/FILENAME)
        const filesToDelete = booking.nail_art_image_urls.map((url: string) => {
          // Extract path from URL
          const match = url.match(/nail-art-uploads\/(.+)$/);
          if (match) {
            return match[1];
          }
          return null;
        }).filter((path: string | null) => path !== null);

        if (filesToDelete.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('nail-art-uploads')
            .remove(filesToDelete);

          if (storageError) {
            console.error('Storage deletion error:', storageError);
            // Continue with booking deletion even if storage deletion fails
          }
        }
      } catch (storageErr) {
        console.error('Error deleting storage files:', storageErr);
        // Continue with booking deletion even if storage deletion fails
      }
    }

    // Delete the booking
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
    }

    // Remove the blocked times associated with this booking
    // Convert booking_time from 24-hour format (HH:MM:SS) to 12-hour format (H:MM AM/PM)
    const [hours, minutes] = booking.booking_time.split(':').map(Number);
    let displayHours = hours;
    let period = 'AM';
    if (hours >= 12) {
      period = 'PM';
      if (hours > 12) displayHours = hours - 12;
    }
    if (hours === 0) displayHours = 12;
    
    const formattedTime = `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
    
    const blockedTimesToRemove = getBlockedTimesForAppointment(formattedTime, booking.duration);
    if (blockedTimesToRemove.length > 0) {
      await supabase
        .from('blocked_times')
        .delete()
        .eq('date', booking.booking_date)
        .in('time', blockedTimesToRemove);
    }

    // Send cancellation SMS to Kinsey (technician)
    const technicianPhone = process.env.TECHNICIAN_PHONE_NUMBER;
    if (technicianPhone) {
      console.log('Sending cancellation notification to technician');
      try {
        // Get service name from booking
        let serviceName = 'Nail Service';
        if (booking.service_id) {
          const services = [
            { id: 'acrylic-short', name: 'Acrylic Sets - Short' },
            { id: 'acrylic-long', name: 'Acrylic Sets - Long' },
            { id: 'gel', name: 'Gel Manicure' },
            { id: 'rebase', name: 'Rebase' },
          ];
          const service = services.find(s => s.id === booking.service_id);
          if (service) serviceName = service.name;
        }

        const cancelSmsResult = await sendAppointmentCancelledToTechnicianSMS(
          technicianPhone,
          booking.customer_name,
          booking.booking_date,
          formattedTime,
          serviceName,
          booking.duration
        );
        console.log('Cancellation SMS result:', cancelSmsResult);
      } catch (smsError) {
        console.error('Failed to send cancellation SMS:', smsError);
        // Don't fail the deletion if SMS fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Booking deleted',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}
