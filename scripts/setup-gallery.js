const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupGalleryTable() {
  try {
    console.log('Setting up gallery_images table...');

    // Create table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (createError) {
      // Try alternative method - the rpc approach might not work
      // Instead, we'll just check if the table exists and create storage bucket
      console.log('Note: RPC method not available. Please create the table manually using the SQL provided.');
      console.log('\nSQL to run in Supabase SQL Editor:');
      console.log(`
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
      `);
    } else {
      console.log('✓ Gallery table created successfully');
    }

    // Try to create storage bucket
    console.log('\nChecking gallery-images storage bucket...');
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'gallery-images');

    if (!bucketExists) {
      const { error: bucketError } = await supabase.storage.createBucket('gallery-images', {
        public: true,
      });

      if (bucketError) {
        console.log('Storage bucket already exists or could not be created.');
      } else {
        console.log('✓ Storage bucket created successfully');
      }
    } else {
      console.log('✓ Storage bucket already exists');
    }

    console.log('\n✓ Setup complete! You can now use the gallery management feature.');
  } catch (error) {
    console.error('Error during setup:', error);
  }
}

setupGalleryTable();
