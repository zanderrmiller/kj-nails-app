-- Add reminder_sent column to track which appointments have had reminders sent
ALTER TABLE bookings
ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;

-- Create index for faster queries when finding appointments that need reminders
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_sent ON bookings(reminder_sent);
CREATE INDEX IF NOT EXISTS idx_bookings_status_reminder ON bookings(status, reminder_sent, booking_date);
