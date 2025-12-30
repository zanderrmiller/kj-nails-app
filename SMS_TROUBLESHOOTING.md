# ClickSend SMS Troubleshooting Guide

## Testing Steps

1. **Start the dev server**
   ```bash
   npm run dev
   ```

2. **Create a test appointment** from the booking page with:
   - Your phone number
   - A valid date/time
   - Any service

3. **Check the server logs** for messages like:
   ```
   === ClickSend SMS Debug ===
   Username configured: true
   API Key configured: true
   Sender ID: KJNails
   Sending SMS to: +1XXXXXXXXXX
   ✅ SMS sent successfully
   ```

## Common Issues & Solutions

### Issue 1: "ClickSend credentials not configured"
**Solution:** Check that `.env.local` has these variables:
```
CLICKSEND_API_USERNAME=your_email
CLICKSEND_API_KEY=your_api_key
CLICKSEND_SENDER_ID=KJNails
```

### Issue 2: "Response status: 401" or "Unauthorized"
**Possible Causes:**
- API credentials are incorrect
- Username/password in wrong format
- API key has changed

**Solution:**
1. Go to https://www.clicksend.com/account/sms/api
2. Verify your API username (usually your email)
3. Generate a new API key if needed
4. Update `.env.local` with the exact values
5. Restart the dev server

### Issue 3: "Response status: 403" or "Invalid Sender ID"
**Solution:**
- Sender ID must be max 11 characters
- Use only alphanumeric characters (no spaces)
- Change to `CLICKSEND_SENDER_ID=KJNails` or similar

### Issue 4: Trial Mode Restrictions
ClickSend trial accounts have these limitations:
- Can only send to **verified phone numbers**
- Must verify your own phone number first in ClickSend dashboard
- May have daily/monthly limits

**Solution:**
1. Log in to https://www.clicksend.com/account
2. Go to **Phone Numbers** section
3. Add and verify your test phone number
4. Try sending to that number

### Issue 5: "Message appears but never arrives"
**Possible Causes:**
- Phone number format wrong
- SMS delivery blocked by carrier
- ClickSend account balance issue
- Customer phone number not in correct format

**Check Server Logs for:**
```
Sending SMS to: +1XXXXXXXXXX
```
Make sure the number starts with `+1` for US numbers.

## Manual API Test

You can test the ClickSend API directly:

```bash
curl -X POST https://api.clicksend.com/v3/sms/send \
  -u "your_email@example.com:YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "body": "Test message from KJ Nails",
        "to": "+1XXXXXXXXXX",
        "source": "KJNails"
      }
    ]
  }'
```

**Expected Success Response:**
```json
{
  "data": {
    "messages": [
      {
        "message_id": "123456789",
        "status": "queued",
        ...
      }
    ]
  },
  "http_code": 200
}
```

## Debug Checklist

- [ ] API Username (email) is correct
- [ ] API Key is correct and up-to-date
- [ ] Sender ID is 11 characters or less
- [ ] Phone number is verified in ClickSend (for trial accounts)
- [ ] Phone number format is `+1XXXXXXXXXX` for US
- [ ] ClickSend account has sufficient balance
- [ ] Server logs show "SMS sent successfully"
- [ ] Phone number in booking matches verified number

## ClickSend Documentation
- Main API Docs: https://www.clicksend.com/developers/
- SMS API: https://www.clicksend.com/developers/docs/sms/send-sms
- Account Settings: https://www.clicksend.com/account/sms/api

## Need More Help?

1. **Check the full server logs** - Look for the `=== ClickSend SMS Debug ===` section
2. **Test with the ClickSend Dashboard** - Try sending a test SMS from their web interface
3. **Contact ClickSend Support** - support@clicksend.com
