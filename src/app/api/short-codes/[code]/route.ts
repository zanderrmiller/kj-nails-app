import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    const { data, error } = await supabase
      .from('short_codes')
      .select('appointment_id')
      .eq('code', params.code)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Short code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      appointmentId: data.appointment_id,
    });
  } catch (error) {
    console.error('Error resolving short code:', error);
    return NextResponse.json(
      { error: 'Failed to resolve short code' },
      { status: 500 }
    );
  }
}
