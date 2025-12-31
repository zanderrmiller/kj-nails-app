import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const imagePath = join(process.cwd(), 'public/compliance/sms-consent.png');
    const imageData = readFileSync(imagePath);
    
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving compliance image:', error);
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
}
