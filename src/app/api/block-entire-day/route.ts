import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const AVAILABLE_TIMES = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM',
];

export async function POST(req: NextRequest) {
  try {
    const { date } = await req.json();

    if (!date) {
      return NextResponse.json({ success: false, error: 'Date is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Block the entire date in availability_blocks
    const { error: blockError } = await supabase
      .from('availability_blocks')
      .insert([{ date, reason: 'blocked' }] as any);

    if (blockError && (blockError as any).code !== '23505') {
      console.error('Error blocking date:', blockError);
      return NextResponse.json({ success: false, error: (blockError as any).message }, { status: 500 });
    }

    // Block all times for this date
    const blockedTimesData = AVAILABLE_TIMES.map((time) => ({ date, time }));
    
    const { error: timesError } = await supabase
      .from('blocked_times')
      .insert(blockedTimesData as any);

    if (timesError && (timesError as any).code !== '23505') {
      console.error('Error blocking times:', timesError);
      return NextResponse.json({ success: false, error: (timesError as any).message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
