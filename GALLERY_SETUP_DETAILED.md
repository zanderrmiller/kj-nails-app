# Setting Up Gallery Management in Supabase

Follow these steps to enable the gallery upload feature:

## Step 1: Create the Database Table

Go to your Supabase project → SQL Editor and run this SQL:

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

## Step 2: Create the Storage Bucket

1. Go to your Supabase project dashboard
2. Click **Storage** in the left sidebar
3. Click **Create new bucket**
4. Name it: `gallery-images` (exactly)
5. Select **Public bucket** (toggle on)
6. Click **Create bucket**

## Step 3: Verify Environment Variables

Check your `.env.local` file has these variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 4: Test the Upload

1. Go to http://localhost:3000/admin
2. Click the "Art Gallery" tab
3. Select an image file and click "Choose & Upload"
4. The image should upload successfully!

## Troubleshooting

- **"Bucket not found"** → Create the `gallery-images` bucket (Step 2)
- **"Failed to create table"** → Run the SQL in Supabase SQL Editor (Step 1)
- **"Table not found"** → Run the SQL from Step 1
- **"Permission denied"** → Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly

## How It Works

- Images are stored in the `gallery-images` storage bucket
- Image metadata is stored in the `gallery_images` database table
- The Art page fetches images from the API in real-time
- The admin can add/remove images without touching code
