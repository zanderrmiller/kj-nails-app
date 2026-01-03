-- Create short_codes table to map short codes to appointments
CREATE TABLE IF NOT EXISTS short_codes (
  code VARCHAR(8) PRIMARY KEY,
  appointment_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_short_codes_code ON short_codes(code);
CREATE INDEX IF NOT EXISTS idx_short_codes_appointment_id ON short_codes(appointment_id);
