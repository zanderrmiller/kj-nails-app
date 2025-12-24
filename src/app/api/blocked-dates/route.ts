import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabase();
    
    if (!supabase) {
      // Return empty array if no Supabase
      return NextResponse.json({ success: true, blockedDates: [] });
    }

    const { data, error } = await supabase
      .from('availability_blocks')
      .select('date')
      .eq('reason', 'blocked');

    if (error) {
      console.error('Error fetching blocked dates:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const blockedDates = (data as any[])?.map((row) => row.date) || [];
    return NextResponse.json({ success: true, blockedDates });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { date, blocked } = await req.json();

    if (!date) {
      return NextResponse.json({ success: false, error: 'Date is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
    }

    if (blocked) {
      // Add blocked date
      const { error } = await supabase
        .from('availability_blocks')
        .insert([{ date, reason: 'blocked' }] as any);

      if (error && (error as any).code !== '23505') { // Ignore duplicate key errors
        console.error('Error blocking date:', error);
        return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
      }
    } else {
      // Remove blocked date
      const { error } = await supabase
        .from('availability_blocks')
        .delete()
        .eq('date', date)
        .eq('reason', 'blocked');

      if (error) {
        console.error('Error unblocking date:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
