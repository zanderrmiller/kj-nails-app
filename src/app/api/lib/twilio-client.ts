import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client: any = null;

// Only initialize if credentials are configured
if (accountSid && authToken && accountSid !== 'your_twilio_account_sid_here') {
  try {
    client = twilio(accountSid, authToken);
  } catch (error) {
    console.warn('Failed to initialize Twilio:', error);
  }
} else {
  console.warn('Twilio credentials not configured. SMS functionality will be disabled.');
}

export interface SendSMSOptions {
  to: string;
  body: string;
}

export interface SendSMSResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * Send an SMS message via Twilio
 */
export async function sendSMS(options: SendSMSOptions): Promise<SendSMSResult> {
  if (!client || !twilioPhoneNumber) {
    console.warn('Twilio not configured. Skipping SMS to:', options.to);
    return {
      success: false,
      error: 'Twilio not configured',
    };
  }

  try {
    console.log(`Sending SMS from ${twilioPhoneNumber} to ${options.to}. Message: "${options.body}"`);
    const message = await client.messages.create({
      from: twilioPhoneNumber,
      to: options.to,
      body: options.body,
    });

    console.log(`SMS sent successfully! SID: ${message.sid}`);
    return {
      success: true,
      messageSid: message.sid,
    };
  } catch (error) {
    console.error('Error sending SMS to', options.to, ':', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send SMS to customer after booking
 */
export async function sendCustomerPendingNotification(
  customerPhone: string,
  customerName: string,
  appointmentDate: string,
  appointmentTime: string,
  referenceId: string
): Promise<SendSMSResult> {
  const body = `Hi ${customerName}! Your KJ Nails appointment for ${appointmentDate} at ${appointmentTime} is PENDING. The owner will confirm shortly. Ref: #${referenceId}`;
  
  return sendSMS({
    to: customerPhone,
    body,
  });
}

/**
 * Send SMS to owner about new booking
 */
export async function sendOwnerNewBookingNotification(
  ownerPhone: string,
  customerName: string,
  customerPhone: string,
  appointmentDate: string,
  appointmentTime: string,
  serviceType: string,
  duration: number,
  price: number,
  confirmationLink: string
): Promise<SendSMSResult> {
  const body = `New booking! ${customerName} (${customerPhone}) - ${serviceType} | ${duration}min | ${appointmentDate} ${appointmentTime} | $${price}. Review: ${confirmationLink}`;
  
  return sendSMS({
    to: ownerPhone,
    body,
  });
}

/**
 * Send SMS to customer confirming appointment
 */
export async function sendCustomerConfirmationNotification(
  customerPhone: string,
  customerName: string,
  appointmentDate: string,
  appointmentTime: string,
  finalPrice: number,
  rescheduleLink: string
): Promise<SendSMSResult> {
  const body = `Confirmed! ${customerName}, your appointment is set for ${appointmentDate} at ${appointmentTime}. Total: $${finalPrice}. Need to reschedule? ${rescheduleLink}`;
  
  return sendSMS({
    to: customerPhone,
    body,
  });
}

/**
 * Send SMS to owner about reschedule request
 */
export async function sendOwnerRescheduleNotification(
  ownerPhone: string,
  customerName: string,
  oldTime: string,
  oldDate: string,
  newTime: string,
  newDate: string,
  approvalLink: string
): Promise<SendSMSResult> {
  const body = `Reschedule request! ${customerName} wants to move from ${oldDate} ${oldTime} to ${newDate} ${newTime}. Review: ${approvalLink}`;
  
  return sendSMS({
    to: ownerPhone,
    body,
  });
}
