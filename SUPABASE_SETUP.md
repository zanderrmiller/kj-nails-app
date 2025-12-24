# Supabase Setup Guide for KJ Nails

## Step 1: Create Supabase Account & Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with email (or GitHub)
4. Create a new project:
   - **Project Name**: `kj-nails` (or your preference)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you (e.g., US East, US West)
5. Wait 2-3 minutes for project to initialize

## Step 2: Get API Keys

1. Once project loads, go to **Settings > API**
2. Copy these and paste into `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Example `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Create Tables

Go to **SQL Editor** in Supabase dashboard and run:

### 1. Create availability_blocks table
```sql
CREATE TABLE availability_blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  reason TEXT DEFAULT 'blocked',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_availability_blocks_date ON availability_blocks(date);
```

### 2. Create blocked_times table
```sql
CREATE TABLE blocked_times (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, time)
);

CREATE INDEX idx_blocked_times_date ON blocked_times(date);
```

### 4. Create bookings table
```sql
CREATE TABLE bookings (
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

CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_phone ON bookings(customer_phone);
```

### 5. Create services table
```sql
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Step 4: Enable Row Level Security (RLS)

In **Authentication > Policies**, enable RLS for all tables:

For `availability_blocks`:
```sql
CREATE POLICY "Anyone can view availability" ON availability_blocks
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage availability" ON availability_blocks
FOR ALL USING (auth.role() = 'authenticated');
```

For `blocked_times`:
```sql
CREATE POLICY "Anyone can view blocked times" ON blocked_times
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage blocked times" ON blocked_times
FOR ALL USING (auth.role() = 'authenticated');
```

For `bookings`:
```sql
CREATE POLICY "Anyone can create bookings" ON bookings
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own bookings" ON bookings
FOR SELECT USING (true);
```

For `services`:
```sql
CREATE POLICY "Anyone can view services" ON services
FOR SELECT USING (true);
```

## Step 5: Insert Initial Data (Optional)

Add blocked dates for unavailable days:
```sql
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
```

Add services:
```sql
INSERT INTO services (id, name, duration, price) VALUES
  ('acrylic-short', 'Acrylic Short', 120, 50.00),
  ('acrylic-long', 'Acrylic Long', 150, 60.00),
  ('gel', 'Gel Manicure', 60, 35.00);
```

## Step 6: Test Connection

The app will automatically use your Supabase credentials once you:
1. Update `.env.local` with your keys
2. Restart the dev server: `npm run dev`

Available dates will now come from the database!

## Troubleshooting

- **"Missing Supabase environment variables"**: Check `.env.local` has correct keys
- **"table does not exist"**: Ensure all SQL from Step 3 was run
- **Database empty**: Run INSERT commands from Step 5
