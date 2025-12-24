import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      images: data || [],
    });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const bucket = 'gallery-images';

    console.log(`Uploading file: ${filename} to bucket: ${bucket}`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, uint8Array, {
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('File uploaded successfully:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);

    const imageUrl = urlData.publicUrl;
    console.log('Public URL:', imageUrl);

    // Get the highest display_order
    const { data: maxOrderData, error: maxOrderError } = await supabase
      .from('gallery_images')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);

    if (maxOrderError) {
      console.error('Error fetching max order:', maxOrderError);
      throw maxOrderError;
    }

    const nextOrder = (maxOrderData && maxOrderData[0]?.display_order || 0) + 1;

    // Insert into gallery_images table
    const { data: insertData, error: insertError } = await supabase
      .from('gallery_images')
      .insert([
        {
          image_url: imageUrl,
          display_order: nextOrder,
        },
      ])
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('Image record created:', insertData);

    return NextResponse.json({
      success: true,
      image: insertData[0],
    });
  } catch (error) {
    console.error('Error uploading gallery image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
