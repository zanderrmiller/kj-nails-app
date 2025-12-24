import { NextRequest, NextResponse } from 'next/server';

// Lazy load Supabase to avoid build-time errors
async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const bookingId = formData.get('bookingId') as string;

    if (!files || files.length === 0 || !bookingId) {
      return NextResponse.json(
        { error: 'Missing files or bookingId' },
        { status: 400 }
      );
    }

    const supabase = await getSupabase();
    const uploadedUrls: string[] = [];

    // Upload each file to Supabase Storage
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `${bookingId}-${timestamp}-${randomStr}-${file.name}`;

      const { data, error } = await supabase.storage
        .from('nail-art-uploads')
        .upload(`${bookingId}/${fileName}`, file, {
          contentType: file.type,
        });

      if (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
          { error: `Failed to upload file: ${file.name}` },
          { status: 500 }
        );
      }

      // Get the public URL
      const { data: publicData } = supabase.storage
        .from('nail-art-uploads')
        .getPublicUrl(`${bookingId}/${fileName}`);

      if (publicData?.publicUrl) {
        uploadedUrls.push(publicData.publicUrl);
      }
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    );
  }
}
