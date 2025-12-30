/**
 * Fraud Protection Module
 * Backend-only protections that are transparent to legitimate users
 */

// In-memory stores for rate limiting (resets on server restart)
// For production, consider using Redis
const ipRequestCounts = new Map<string, { timestamps: number[]; flagged: boolean }>();
const phoneBookings = new Map<string, { timestamps: number[]; names: Set<string> }>();
const suspiciousActivity = new Map<string, number>();

const CONFIG = {
  IP_RATE_LIMIT: 15, // max bookings per IP per hour
  IP_RATE_WINDOW: 60 * 60 * 1000, // 1 hour
  PHONE_RATE_LIMIT: 3, // max bookings per phone per 24 hours
  PHONE_RATE_WINDOW: 24 * 60 * 60 * 1000, // 24 hours
  SAME_PHONE_MULTIPLE_NAMES: 5, // flag if same phone used with 5+ different names in 24h
  SUSPICIOUS_THRESHOLD: 3, // strikes before blocking
};

/**
 * Validate customer name - reject clearly fake entries
 */
export function validateCustomerName(name: string): { valid: boolean; reason?: string } {
  if (!name || name.length < 2) {
    return { valid: false, reason: 'Name too short' };
  }

  if (name.length > 100) {
    return { valid: false, reason: 'Name too long' };
  }

  // Reject obviously fake test names
  const fakePhrases = [
    'test', 'admin', 'fake', 'spam', 'bot', 'xxx', 'aaa', 'zzzz',
    '123', '000', 'qwerty', 'asdf', 'john doe', 'jane doe',
    'temp', 'temp2', 'test2', 'admin2'
  ];

  const lowerName = name.toLowerCase();
  if (fakePhrases.some(phrase => lowerName === phrase || lowerName.includes(phrase))) {
    return { valid: false, reason: 'Suspicious name pattern' };
  }

  // Must have at least one letter
  if (!/[a-zA-Z]/.test(name)) {
    return { valid: false, reason: 'Name must contain letters' };
  }

  // Check for excessive special characters or repeated characters
  const specialCharCount = (name.match(/[^a-zA-Z0-9\s\-']/g) || []).length;
  if (specialCharCount > 3) {
    return { valid: false, reason: 'Too many special characters' };
  }

  // Check for repeated characters (e.g., "aaaaaaa")
  if (/(.)\1{4,}/.test(name)) {
    return { valid: false, reason: 'Suspicious character pattern' };
  }

  return { valid: true };
}

/**
 * Validate phone number - check format
 */
export function validatePhoneNumber(phone: string): { valid: boolean; reason?: string } {
  if (!phone) {
    return { valid: true }; // Phone is optional for some bookings
  }

  const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');

  // Must be 10-15 digits
  if (!/^\d{10,15}$/.test(cleaned)) {
    return { valid: false, reason: 'Invalid phone format' };
  }

  // Reject obvious test numbers
  const testNumbers = ['0000000000', '1111111111', '2222222222', '9999999999', '5555555555'];
  if (testNumbers.includes(cleaned)) {
    return { valid: false, reason: 'Invalid phone number' };
  }

  return { valid: true };
}

/**
 * Check IP-based rate limiting
 * Returns true if request should be allowed, false if rate limited
 */
export function checkIPRateLimit(ip: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const record = ipRequestCounts.get(ip) || { timestamps: [], flagged: false };

  // If IP is flagged as suspicious, require longer cooldown
  if (record.flagged) {
    return {
      allowed: false,
      reason: 'Too many booking attempts from this location. Please try again later.',
    };
  }

  // Clean up old timestamps outside the window
  const recentTimestamps = record.timestamps.filter(ts => now - ts < CONFIG.IP_RATE_WINDOW);

  if (recentTimestamps.length >= CONFIG.IP_RATE_LIMIT) {
    // Flag this IP after hitting rate limit
    ipRequestCounts.set(ip, { timestamps: recentTimestamps, flagged: true });
    return {
      allowed: false,
      reason: 'Too many booking attempts. Please try again later.',
    };
  }

  // Add current request
  recentTimestamps.push(now);
  ipRequestCounts.set(ip, { timestamps: recentTimestamps, flagged: false });

  return { allowed: true };
}

/**
 * Check phone number rate limiting
 * Prevents same phone from spamming bookings
 */
export function checkPhoneRateLimit(phone: string): { allowed: boolean; reason?: string } {
  if (!phone) return { allowed: true }; // No phone = no rate limit

  const now = Date.now();
  const record = phoneBookings.get(phone) || { timestamps: [], names: new Set() };

  // Clean up old timestamps outside the window
  const recentTimestamps = record.timestamps.filter(ts => now - ts < CONFIG.PHONE_RATE_WINDOW);

  if (recentTimestamps.length >= CONFIG.PHONE_RATE_LIMIT) {
    return {
      allowed: false,
      reason: 'Too many bookings from this phone number. Please try again later.',
    };
  }

  // Update the record
  recentTimestamps.push(now);
  phoneBookings.set(phone, { timestamps: recentTimestamps, names: record.names });

  return { allowed: true };
}

/**
 * Track name usage for phone number
 * Flags if same phone uses many different names (likely bot spam)
 */
export function trackPhoneName(phone: string, name: string): { suspicious: boolean; count?: number } {
  if (!phone) return { suspicious: false };

  const record = phoneBookings.get(phone) || { timestamps: [], names: new Set() };
  record.names.add(name);

  phoneBookings.set(phone, record);

  const nameCount = record.names.size;
  const suspicious = nameCount >= CONFIG.SAME_PHONE_MULTIPLE_NAMES;

  if (suspicious) {
    console.warn(
      `⚠️ FRAUD ALERT: Phone ${phone} used with ${nameCount} different names (limit: ${CONFIG.SAME_PHONE_MULTIPLE_NAMES})`
    );
  }

  return { suspicious, count: nameCount };
}

/**
 * Log suspicious activity for manual review
 */
export function logSuspiciousActivity(ip: string, reason: string, details: Record<string, any>) {
  const now = new Date().toISOString();
  const key = `${ip}-${reason}`;

  const count = (suspiciousActivity.get(key) || 0) + 1;
  suspiciousActivity.set(key, count);

  console.warn(`[FRAUD PROTECTION] ${now} - IP: ${ip} - ${reason}`);
  console.warn(`Details:`, JSON.stringify(details, null, 2));
  console.warn(`Incident count for this IP/reason: ${count}`);
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Check headers in order of preference
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * All-in-one fraud check function
 */
export function performFraudChecks(
  request: Request,
  customerName: string,
  customerPhone: string
): { allowed: boolean; error?: string } {
  const ip = getClientIP(request);

  // 1. Validate name
  const nameValidation = validateCustomerName(customerName);
  if (!nameValidation.valid) {
    logSuspiciousActivity(ip, 'Invalid Name', { customerName, reason: nameValidation.reason });
    return { allowed: false, error: 'Please enter a valid name' };
  }

  // 2. Validate phone
  const phoneValidation = validatePhoneNumber(customerPhone);
  if (!phoneValidation.valid) {
    logSuspiciousActivity(ip, 'Invalid Phone', { customerPhone, reason: phoneValidation.reason });
    return { allowed: false, error: 'Please enter a valid phone number' };
  }

  // 3. Check IP rate limiting
  const ipLimitCheck = checkIPRateLimit(ip);
  if (!ipLimitCheck.allowed) {
    logSuspiciousActivity(ip, 'IP Rate Limit Exceeded', { customerName, customerPhone });
    return { allowed: false, error: ipLimitCheck.reason };
  }

  // 4. Check phone rate limiting
  const phoneLimitCheck = checkPhoneRateLimit(customerPhone);
  if (!phoneLimitCheck.allowed) {
    logSuspiciousActivity(ip, 'Phone Rate Limit Exceeded', { customerName, customerPhone });
    return { allowed: false, error: phoneLimitCheck.reason };
  }

  // 5. Track name usage for this phone
  const phoneNameCheck = trackPhoneName(customerPhone, customerName);
  if (phoneNameCheck.suspicious) {
    logSuspiciousActivity(ip, 'Same Phone Multiple Names', {
      customerPhone,
      nameCount: phoneNameCheck.count,
      suspiciousCount: CONFIG.SAME_PHONE_MULTIPLE_NAMES,
    });
    // Don't block, just log for now (may be legitimate shared phone)
  }

  return { allowed: true };
}

/**
 * Get fraud stats for monitoring (optional - for admin dashboard)
 */
export function getFraudStats() {
  return {
    flaggedIPs: Array.from(ipRequestCounts.entries())
      .filter(([, record]) => record.flagged)
      .length,
    totalIPs: ipRequestCounts.size,
    suspiciousActivity: Array.from(suspiciousActivity.entries()).map(([key, count]) => ({
      incident: key,
      occurrences: count,
    })),
  };
}
