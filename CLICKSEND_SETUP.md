# ClickSend SMS Integration Setup

## What Was Done

### 1. **Removed Twilio Integration**
- Deleted `src/app/api/lib/twilio-client.ts` (Twilio client)
- Removed Twilio from `package.json` dependencies
- Removed all commented Twilio code from `src/app/api/bookings/route.ts`

### 2. **Created ClickSend SMS Service**
- Created `src/lib/sms-service.ts` with the following functions:
  - `sendSMS()` - General SMS sending function
  - `sendAppointmentBookedSMS()` - Sends confirmation when appointment is booked
  - `sendAppointmentReminderSMS()` - For future reminder feature
  - `sendAppointmentCancelledSMS()` - For future cancellation notifications

### 3. **Updated Bookings API**
- Modified `src/app/api/bookings/route.ts` to:
  - Import ClickSend SMS service
  - Send SMS confirmation to customers after successful booking
  - Gracefully handle SMS failures (won't block appointment creation)

### 4. **Updated Environment Variables**
- Updated `.env.local` with ClickSend credentials:
  - `CLICKSEND_API_USERNAME` - Your ClickSend API username
  - `CLICKSEND_API_KEY` - Your ClickSend API key
  - `CLICKSEND_SENDER_ID` - Your brand name (defaults to "KJNails")

## Setup Instructions

### 1. Get ClickSend Credentials
1. Sign up at https://www.clicksend.com
2. Go to Account Settings > API
3. Get your API Username and API Key
4. Add funds to your account

### 2. Update Environment Variables
Edit `.env.local` and replace:
```
CLICKSEND_API_USERNAME=your_actual_username_here
CLICKSEND_API_KEY=your_actual_api_key_here
CLICKSEND_SENDER_ID=YourBrandName (max 11 chars)
```

### 3. Test the Integration
1. Create a test appointment on the booking page
2. Check that:
   - Appointment is created successfully
   - SMS is sent to the customer's phone
   - Message format looks correct

## Phone Number Format

The SMS service automatically handles phone number formatting:
- Converts 10-digit US numbers to `+1XXXXXXXXXX` format
- Handles international numbers with country codes
- Adds `+` prefix if missing

## Current SMS Message Templates

### Appointment Booked
```
Hi {CustomerName}! Your appointment at KJ Nails is confirmed for {Date} at {Time} ({Service}). We look forward to seeing you!
```

## Future Enhancements

The SMS service is set up for easy addition of:
- Appointment reminders (24 hours before)
- Appointment cancellation notifications
- Rescheduling confirmations
- Owner notifications for new bookings

## Troubleshooting

If SMS isn't sending:

1. **Check credentials** - Verify `CLICKSEND_API_USERNAME` and `CLICKSEND_API_KEY` are correct
2. **Check phone number** - Ensure customer phone is in proper format (10+ digits)
3. **Check balance** - Verify you have funds in ClickSend account
4. **Check logs** - Look at server logs for error messages
5. **Test API** - Use ClickSend dashboard to verify API works

## Pricing

ClickSend charges per SMS sent. Prices vary by country but typically:
- Domestic SMS: $0.03-0.10 per message
- International SMS: varies by country

## Support

- ClickSend Docs: https://www.clicksend.com/developers/
- ClickSend Support: support@clicksend.com
