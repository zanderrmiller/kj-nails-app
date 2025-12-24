import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

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
    let buffer = await file.arrayBuffer();
    let uint8Array = new Uint8Array(buffer);

    // Compress image using sharp (80% quality for good balance)
    try {
      const compressedBuffer = await sharp(uint8Array)
        .withMetadata() // Preserve orientation and metadata
        .toFormat('webp', { quality: 80 })
        .toBuffer();
      
      uint8Array = new Uint8Array(compressedBuffer);
      console.log(`Image compressed: ${(buffer.byteLength / 1024).toFixed(2)}KB → ${(compressedBuffer.byteLength / 1024).toFixed(2)}KB`);
    } catch (compressionError) {
      console.warn('Compression failed, using original image:', compressionError);
      // If compression fails, use the original image
    }

    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.split('.')[0]}.webp`;
    const bucket = 'gallery-images';

    console.log(`Uploading file: ${filename} to bucket: ${bucket}`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, uint8Array, {
        contentType: 'image/webp',
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
