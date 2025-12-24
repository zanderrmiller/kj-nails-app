import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Unblock the date in availability_blocks
    const { error: unblockError } = await supabase
      .from('availability_blocks')
      .delete()
      .eq('date', date)
      .eq('reason', 'blocked');

    if (unblockError) {
      console.error('Error unblocking date:', unblockError);
      return NextResponse.json({ success: false, error: unblockError.message }, { status: 500 });
    }

    // Remove all blocked times for this date
    const { error: timesError } = await supabase
      .from('blocked_times')
      .delete()
      .eq('date', date);

    if (timesError) {
      console.error('Error unblocking times:', timesError);
      return NextResponse.json({ success: false, error: timesError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
