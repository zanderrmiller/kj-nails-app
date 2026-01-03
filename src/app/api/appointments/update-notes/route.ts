import { NextRequest, NextResponse } from 'next/server';

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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, nailArtNotes, nailArtImageUrls } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    const supabaseAdmin = await getSupabaseAdmin();

    // Update only nail art notes and images - no date/time changes
    const updateData: any = {};
    if (nailArtNotes !== undefined) updateData.nail_art_notes = nailArtNotes;
    if (nailArtImageUrls !== undefined) updateData.nail_art_image_urls = nailArtImageUrls;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment notes:', error);
      return NextResponse.json({ error: 'Failed to update appointment notes' }, { status: 500 });
    }

    return NextResponse.json({ success: true, appointment: data });
  } catch (error) {
    console.error('Error in update-notes API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
