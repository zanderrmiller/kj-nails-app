# Fraud Protection System

## Overview

The booking API now includes **backend-only fraud protection** that prevents bot abuse and SMS spam charges without impacting the user experience. All checks are transparent to legitimate customers.

## What's Protected

### 1. **IP-Based Rate Limiting**
- **Limit**: 15 bookings per IP per hour
- **Action**: Blocks requests from the same IP after exceeding limit
- **Effect on Users**: Legitimate users won't hit this (15 bookings/hour = ~1 per 4 minutes)

### 2. **Phone Number Rate Limiting**
- **Limit**: 3 bookings per phone number per 24 hours
- **Action**: Prevents same customer from spam booking
- **Effect on Users**: If a customer books 3 times, they'll need to wait 24 hours (realistic limitation)

### 3. **Phone Number + Multiple Names Detection**
- **Limit**: 5+ different names with same phone number in 24 hours
- **Action**: Logs suspicious activity (doesn't block yet - may be legitimate)
- **Effect on Users**: None - legitimate family members can share a phone

### 4. **Input Validation**
- **Name Validation**:
  - Rejects test phrases: "test", "admin", "fake", "spam", "bot", etc.
  - Requires 2-100 characters
  - Must contain letters
  - Rejects excessive special characters
  
- **Phone Validation**:
  - Requires proper phone format (10-15 digits)
  - Rejects obvious test numbers: 0000000000, 1111111111, etc.

### 5. **Suspicious Activity Logging**
- All blocked/flagged activities are logged with:
  - Timestamp
  - IP address
  - Customer name & phone
  - Reason for flag
  - Frequency tracking

## Error Messages Shown to Users

Legitimate users won't see these messages, but if someone hits rate limits, they'll get:

```
❌ "Too many booking attempts. Please try again later."
❌ "Too many booking attempts from this location. Please try again later."
❌ "Too many bookings from this phone number. Please try again later."
❌ "Please enter a valid name"
❌ "Please enter a valid phone number"
```

## Monitoring

### Server Logs
Every fraud check result is logged to console. Search for:
- `⚠️ FRAUD ALERT` - Suspicious pattern detected
- `[FRAUD PROTECTION]` - Activity flagged
- `❌ Booking rejected by fraud protection` - Request blocked

Example log:
```
⚠️ FRAUD ALERT: Phone 5551234567 used with 7 different names (limit: 5)
[FRAUD PROTECTION] 2025-12-30T10:15:30.000Z - IP: 123.45.67.89 - IP Rate Limit Exceeded
Details: {
  "customerName": "John",
  "customerPhone": "5551234567"
}
```

### Admin Endpoint
```
GET /api/fraud-stats

Response:
{
  "flaggedIPs": 2,
  "totalIPs": 156,
  "suspiciousActivity": [
    {
      "incident": "192.168.1.100-Invalid Name",
      "occurrences": 3
    },
    {
      "incident": "192.168.1.101-IP Rate Limit Exceeded",
      "occurrences": 1
    }
  ]
}
```

## How It Works (Technical)

### Fraud Check Flow
1. **Extract client IP** from request headers
2. **Validate name** - check format and reject test patterns
3. **Validate phone** - check format and reject test numbers
4. **Check IP rate limit** - prevent spam from single source
5. **Check phone rate limit** - prevent duplicate bookings
6. **Track name usage** - detect same phone + multiple names
7. **Log suspicious activity** - for manual review

### Performance Impact
- **Minimal**: All checks run in memory with < 1ms overhead
- **No database queries needed** for fraud checks
- **SMS sending** still requires network I/O (main cost)

## Reset/Cleanup

The protection system uses in-memory storage that:
- **Persists during server runtime** - ~1 hour typical
- **Resets on server restart** - Vercel redeploys daily
- **Automatic cleanup** - Old timestamps removed from memory

For production with longer uptime:
- Replace with Redis-based rate limiting
- Add database audit table for fraud history
- Implement admin UI for reviewing flagged activity

## Configuration

To adjust limits, edit [src/lib/fraud-protection.ts](src/lib/fraud-protection.ts):

```typescript
const CONFIG = {
  IP_RATE_LIMIT: 15,                    // bookings per IP per hour
  IP_RATE_WINDOW: 60 * 60 * 1000,       // 1 hour
  PHONE_RATE_LIMIT: 3,                  // bookings per phone per 24 hours
  PHONE_RATE_WINDOW: 24 * 60 * 60 * 1000, // 24 hours
  SAME_PHONE_MULTIPLE_NAMES: 5,         // flag at 5+ names per phone
};
```

## FAQ

### Q: Will this block real customers?
**A**: No. Real customers booking legitimate appointments won't hit these limits:
- Booking more than 15 times from same IP in 1 hour? Never
- Booking 4+ times from same phone in 24 hours? Very rare
- Multiple names on same phone? Might happen (we log but don't block)

### Q: What about international customers?
**A**: Phone validation accepts 10-15 digit numbers with country codes. Just use proper international format like `+441234567890`.

### Q: Can I see who got blocked?
**A**: Yes! Check the server logs for `[FRAUD PROTECTION]` entries, or call GET `/api/fraud-stats` to see summary.

### Q: What if a family shares a phone?
**A**: They can book multiple times (up to 3 per 24 hours). Different names are logged but don't block the booking.

### Q: Does this stop determined attackers?
**A**: It stops casual bot attacks and spam. Determined attackers would need:
- Multiple IPs (proxies/botnets)
- Phone number verification (harder to obtain at scale)
- Legitimate-looking names (defeats the purpose)

For extreme cases, add email verification or CAPTCHA later.

## Next Steps

1. ✅ **Now**: Deploy and monitor fraud logs
2. **Monitor**: Watch server logs for fraud alerts over next week
3. **Tune**: Adjust limits if legitimate users complain
4. **Scale**: Add Redis-based rate limiting if needed
5. **Enhance**: Add email verification for next level of security
