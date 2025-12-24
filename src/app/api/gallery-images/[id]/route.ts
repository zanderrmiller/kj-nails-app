import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the image URL first
    const { data: imageData, error: fetchError } = await supabase
      .from('gallery_images')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (imageData && imageData.image_url) {
      // Extract filename from URL
      const filename = imageData.image_url.split('/').pop();
      if (filename) {
        // Delete from storage
        await supabase.storage
          .from('gallery-images')
          .remove([filename]);
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
