# 🚀 Supabase Setup - Quick Start

## Step 1: Create Supabase Project (2 minutes)

1. Go to https://supabase.com
2. Click **"Start your project"**
3. Sign in with email or GitHub
4. Click **"New Project"**
5. Fill in:
   - **Project Name**: `kj-nails` (or your choice)
   - **Database Password**: Create strong password (save it!)
   - **Region**: Pick closest to you (US East for East Coast)
6. Wait 2-3 minutes for it to load

## Step 2: Get Your API Keys (1 minute)

Once project loads:
1. Click **Settings** (⚙️) in bottom left
2. Click **API**
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

## Step 3: Update .env.local (1 minute)

Open `.env.local` in your project and replace with your actual keys:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Create Tables in Supabase (2 minutes)

In your Supabase dashboard:
1. Click **SQL Editor** (left sidebar)
2. Click **New Query**
3. **Copy and paste** this entire SQL:

```sql
-- Create availability_blocks table
CREATE TABLE IF NOT EXISTS availability_blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  reason TEXT DEFAULT 'blocked',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_availability_blocks_date ON availability_blocks(date);

-- Insert blocked dates (days WITHOUT availability)
INSERT INTO availability_blocks (date, reason) VALUES
  ('2024-12-02', 'blocked'),
  ('2024-12-04', 'blocked'),
  ('2024-12-06', 'blocked'),
  ('2024-12-11', 'blocked'),
  ('2024-12-13', 'blocked'),
  ('2024-12-14', 'blocked'),
  ('2024-12-16', 'blocked'),
  ('2024-12-18', 'blocked'),
  ('2024-12-20', 'blocked'),
  ('2024-12-21', 'blocked'),
  ('2024-12-23', 'blocked'),
  ('2024-12-25', 'blocked'),
  ('2024-12-27', 'blocked'),
  ('2024-12-28', 'blocked'),
  ('2024-12-30', 'blocked');

-- Create bookings table (for future use)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_id TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration INTEGER NOT NULL,
  addons TEXT[],
  total_price DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
```

4. Click **Run** (▶️ button)
5. You should see "Success" messages

## Step 5: Enable Row Level Security (Optional but Recommended)

1. Click **Authentication** (left sidebar)
2. Click **Policies**
3. Click **Enable RLS** for `availability_blocks` table
4. Create a policy:
   - Click **New Policy** > **For SELECT**
   - Allow: `true` (anyone can view)
   - Click **Save**

## Step 6: Test It! (1 minute)

1. Stop the dev server if running (Ctrl+C)
2. Restart: `npm run dev`
3. Go to http://localhost:3000/book
4. Calendar should now show:
   - **Green dates**: Available (1, 3, 5, 7, 8, 9, 10, 12, 15, 17, 19, 22, 24, 26, 29, 31)
   - **Grey dates**: Blocked (2, 4, 6, 11, 13, 14, 16, 18, 20, 21, 23, 25, 27, 28, 30)

## ✅ Done!

Your calendar now pulls availability from Supabase. To modify blocked dates:
- Add new date: Insert in `availability_blocks` table
- Remove date: Delete from `availability_blocks` table

All changes appear instantly in the calendar!
