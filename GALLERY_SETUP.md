# Gallery Management Setup

The gallery management feature allows you to upload, view, and delete images from the Art gallery page directly from the admin panel.

## Setup Instructions

### 1. Create the Gallery Images Table

Go to your Supabase project and run the following SQL in the SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_display_order ON gallery_images(display_order);

ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read" ON gallery_images;
CREATE POLICY "Allow public read" ON gallery_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role" ON gallery_images;
CREATE POLICY "Allow service role" ON gallery_images
  FOR ALL USING (auth.role() = 'service_role');
```

### 2. Create the Storage Bucket

In your Supabase project, go to Storage and create a new bucket called `gallery-images` with public access enabled.

### 3. Admin Panel Access

The gallery management section is now available in the admin panel under the "Art Gallery" tab.

## Features

- **Upload Images**: Click the upload button to add new images to the gallery
- **View Gallery**: See all uploaded images in a grid layout
- **Delete Images**: Hover over an image and click "Delete" to remove it
- **Auto-ordering**: Images are automatically assigned a display order

## API Endpoints

- `GET /api/gallery-images` - Fetch all gallery images
- `POST /api/gallery-images` - Upload a new image
- `DELETE /api/gallery-images/[id]` - Delete an image by ID

## How It Works

1. Images are stored in Supabase Storage bucket `gallery-images`
2. Metadata is stored in the `gallery_images` database table
3. The Art page (`/art`) fetches images from the API
4. Admin can manage images without touching the code
