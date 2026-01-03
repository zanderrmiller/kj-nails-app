import { NextRequest, NextResponse } from 'next/server';
import { sendAppointmentRejectedSMS } from '@/lib/sms-service';

interface RejectRequest {
  bookingId: string;
  customerPhone: string;
  customerName: string;
  sendMessage: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: RejectRequest = await request.json();
    const { bookingId, customerPhone, customerName, sendMessage } = body;

    if (!bookingId || !customerPhone || !customerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send rejection SMS to customer if requested
    if (sendMessage) {
      try {
        const smsResult = await sendAppointmentRejectedSMS(customerPhone, customerName);
        console.log('Rejection SMS result:', smsResult);
      } catch (smsError) {
        console.error('Failed to send rejection SMS:', smsError);
        // Don't fail the rejection if SMS fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment rejection processed',
    });
  } catch (error) {
    console.error('Rejection error:', error);
    return NextResponse.json(
      { error: 'Failed to process rejection' },
      { status: 500 }
    );
  }
}
