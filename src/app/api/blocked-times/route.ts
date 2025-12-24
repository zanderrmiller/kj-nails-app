import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getServiceRoleSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ success: false, error: 'Date is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    
    if (!supabase) {
      // Return empty array if no Supabase
      return NextResponse.json({ success: true, blockedTimes: [] });
    }

    const { data, error } = await supabase
      .from('blocked_times')
      .select('time')
      .eq('date', date);

    if (error) {
      console.error('Error fetching blocked times:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const blockedTimes = (data as any[])?.map((row) => row.time) || [];
    return NextResponse.json({ success: true, blockedTimes });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { date, time, blocked } = await req.json();

    if (!date || !time) {
      return NextResponse.json({ success: false, error: 'Date and time are required' }, { status: 400 });
    }

    const supabase = getServiceRoleSupabase();
    
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
    }

    if (blocked) {
      // Add blocked time
      const { error } = await supabase
        .from('blocked_times')
        .insert([{ date, time }] as any);

      if (error && (error as any).code !== '23505') { // Ignore duplicate key errors
        console.error('Error blocking time:', error);
        return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
      }
    } else {
      // Remove blocked time
      const { error } = await supabase
        .from('blocked_times')
        .delete()
        .eq('date', date)
        .eq('time', time);

      if (error) {
        console.error('Error unblocking time:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
