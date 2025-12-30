import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/lib/sms-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, message } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Missing phoneNumber or message' },
        { status: 400 }
      );
    }

    console.log('=== Testing SMS ===');
    console.log('Phone:', phoneNumber);
    console.log('Message:', message);

    const result = await sendSMS({
      to: phoneNumber,
      body: message,
    });

    console.log('Result:', result);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Test SMS error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
