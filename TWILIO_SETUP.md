# Twilio SMS Integration Setup

## Overview
The KJ Nails app now uses **Twilio** for SMS notifications instead of ClickSend. This guide will help you configure your Twilio account and get SMS working.

## Prerequisites
- ✅ Twilio account created
- ✅ Verified toll-free phone number
- ✅ Account SID and Auth Token

## Quick Setup Steps

### 1. Get Your Twilio Credentials
1. Go to [Twilio Console](https://www.twilio.com/console)
2. Copy your **Account SID** (looks like: `ACxxxxxxxxxxxxxxxxxx`)
3. Copy your **Auth Token** (appears in the main dashboard)
4. Go to **Phone Numbers > Manage Numbers** to get your verified number

### 2. Update `.env.local`
Add your Twilio credentials to the `.env.local` file:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=AC...your_sid_here...
TWILIO_AUTH_TOKEN=...your_auth_token_here...
TWILIO_PHONE_NUMBER=+1234567890  # Your verified phone number
```

### 3. Test SMS
Test that SMS is working by sending a test message:

```bash
curl -X POST http://localhost:3000/api/test-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1XXXXXXXXXX",
    "message": "Test message from KJ Nails"
  }'
```

You should see a successful response with a message SID.

## SMS Functions Available

The SMS service provides these functions:

- `sendSMS()` - General SMS sending
- `sendAppointmentBookedSMS()` - Customer appointment confirmation
- `sendAppointmentReminderSMS()` - Day-of appointment reminder
- `sendAppointmentCancelledSMS()` - Cancellation notification
- `sendTechnicianConfirmationSMS()` - New appointment for Kinsey
- `sendAppointmentConfirmedSMS()` - Final confirmation after Kinsey approves
- `sendAppointmentEditedSMS()` - Rescheduled appointment notification
- `sendAppointmentCancelledToTechnicianSMS()` - Cancellation to Kinsey

## Twilio SMS Pricing

Twilio charges per SMS:
- **Outbound SMS**: ~$0.0075 per SMS (US)
- **Inbound SMS**: ~$0.0075 per SMS (varies by country)
- **Toll-Free SMS**: ~$0.0075 per SMS (paid plan required)

Monitor usage in your [Twilio Dashboard](https://www.twilio.com/console).

## Troubleshooting

### "Twilio credentials not configured"
- Check `.env.local` has all three variables
- Verify no typos in credentials
- Restart the development server: `npm run dev`

### SMS not sending
- Verify phone number is in E.164 format: `+1XXXXXXXXXX`
- Check Twilio account balance/trial credits
- Review server logs for error details
- Test with the `/api/test-sms` endpoint

### Message delivery slow
- SMS can take 1-3 seconds to deliver
- Check Twilio logs for any failures
- Verify recipient phone number is correct

### Invalid phone number errors
- Ensure phone numbers include country code
- US numbers should be: `+1XXXXXXXXXX`
- Remove spaces, parentheses, or dashes

## Production Deployment

When deploying to production (Vercel):

1. **Set environment variables** in Vercel project settings:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

2. **Verify toll-free number** is still verified in Twilio

3. **Monitor SMS logs** in Twilio Dashboard

4. **Test before going live** with real numbers

## Documentation Links

- [Twilio Docs](https://www.twilio.com/docs/)
- [Twilio SMS Quickstart](https://www.twilio.com/docs/sms/quickstart/node)
- [Twilio Console](https://www.twilio.com/console)
- [E.164 Phone Format](https://www.twilio.com/docs/glossary/what-e164-phone-number-format)

## Backup Plan

If Twilio goes down:
- ✅ Appointments still get created and stored in Supabase
- SMS notifications fail gracefully
- Users can see their appointments in the app
- Admin gets the confirmed status in the dashboard
