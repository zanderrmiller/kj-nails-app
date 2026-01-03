# Automated Appointment Reminders - Quick Start Guide

## What You Need to Do (3 Simple Steps)

### Step 1: Run Database Migration
Go to Supabase → SQL Editor and run this:

```sql
ALTER TABLE bookings
ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_bookings_reminder_sent ON bookings(reminder_sent);
CREATE INDEX IF NOT EXISTS idx_bookings_status_reminder ON bookings(status, reminder_sent, booking_date);
```

This adds a column to track which appointments have received reminders.

### Step 2: Deploy to Vercel
Push your code to GitHub:

```bash
git add -A
git commit -m "feat: add appointment reminders"
git push
```

Vercel automatically deploys and sets up the cron job. Done!

### Step 3: Set Environment Variable (Optional but Recommended)

For extra security, add this to your Vercel project:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `CRON_SECRET` = `[any random string you create]`

Example: `CRON_SECRET=my_secure_secret_12345`

**That's it!** The reminders will start sending automatically.

---

## How It Works

**Schedule:** The cron runs every 6 hours (4 times per day)
- 12:00 AM UTC
- 6:00 AM UTC  
- 12:00 PM UTC
- 6:00 PM UTC

**Each time it runs:**
1. Finds all confirmed appointments scheduled for ~24 hours from now
2. **Filters for only appointments starting at: 9:00 AM, 12:00 PM, 3:00 PM, or 6:00 PM**
3. Sends SMS reminders to customers who haven't received one yet
4. Marks them as sent so they don't get duplicate reminders

**Appointments outside these start times will NOT receive reminders.** This lets you control reminder volume by only targeting specific appointment slots throughout the day.

**Message sent to customers:**
```
Hi [Name]! Reminder: Your KJ Nails appointment is tomorrow at [time] ([date]). See you then!

Reschedule/Cancel: [link]
```

---

## Verify It's Working

### Check 1: View Vercel Cron Logs
1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" → Latest deployment
3. Scroll to "Functions" section
4. Look for `send-appointment-reminders` - you should see recent executions

### Check 2: Query Your Database
In Supabase SQL Editor, check if reminders were marked as sent:

```sql
SELECT customer_name, booking_date, booking_time, reminder_sent 
FROM bookings 
WHERE reminder_sent = true 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check 3: Test Manually
Make a test POST request (optional):

```bash
curl -X POST https://your-domain.vercel.app/api/send-appointment-reminders \
  -H "x-vercel-cron: true"
```

Replace `your-domain.vercel.app` with your actual domain.

---

## What Happens Next

**Every time the cron runs (every 6 hours):**
- ✅ Customers with appointments ~24 hours away get a reminder SMS
- ✅ SMS includes a personalized reschedule/cancel link
- ✅ No duplicate reminders are sent

**Example Timeline:**
- Monday 9:00 AM: Cron runs → finds appointments for Tuesday 9 AM - 11 AM
- Monday 3:00 PM: Cron runs → finds appointments for Tuesday 3 PM - 5 PM  
- Tuesday 9:00 AM: Cron runs → finds appointments for Wednesday 9 AM - 11 AM
- etc.

So appointments get reminded ~24 hours in advance, and the 6-hour schedule ensures all appointment times are covered.

---

## FAQ

**Q: Why don't some appointments get reminders?**
A: Reminders are only sent for appointments starting at 9:00 AM, 12:00 PM, 3:00 PM, or 6:00 PM. Appointments at other times won't receive reminders. To change this, edit the `allowedStartTimes` array in the reminder endpoint.

**Q: Will customers get multiple reminders?**
A: No. The system marks reminders as sent and won't send duplicates.

**Q: What if I want to change the reminder time?**
A: You'd need to modify the code to send reminders at a different time (e.g., 48 hours before). For now, it's set to 24 hours.

**Q: What if someone cancels an appointment?**
A: The appointment record is deleted, so no reminder is sent. If a reminder was already sent, they won't be affected.

**Q: Do I need to set CRON_SECRET?**
A: No, it's optional. Vercel's cron automatically verifies requests. The secret just adds extra security if you want to call the endpoint manually.

**Q: Can I test this before deploying?**
A: Yes! Push to a staging branch, or make a test API call using the curl command above.

---

## Troubleshooting

### Reminders not being sent?

**First check:**
1. Go to Vercel Dashboard → Your project → Deployments
2. Check if the latest deployment succeeded (should show a green checkmark)
3. If it failed, click it and check the build logs for errors

**Then check:**
- Do you have confirmed appointments in the database?
- Are they scheduled for tomorrow (within 23-25 hours)?
- Does the `reminder_sent` column exist? (Run: `SELECT reminder_sent FROM bookings LIMIT 1`)
- Are `customer_phone` numbers filled in?

**Check SMS logs:**
- Go to Twilio Console → Messages
- Look for recent messages to verify they were sent

---

## Under the Hood

- **Endpoint:** `POST /api/send-appointment-reminders`
- **Vercel Config:** `vercel.json`
- **Code:** `src/app/api/send-appointment-reminders/route.ts`
- **SMS Function:** `src/lib/sms-service.ts` (`sendAppointmentReminderWithLinkSMS`)
- **Database:** Supabase `bookings` table with new `reminder_sent` column
