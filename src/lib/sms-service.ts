import axios from 'axios';

const CLICKSEND_API_URL = 'https://api.clicksend.com/v3';

interface SendSMSOptions {
  to: string;
  body: string;
}

interface SMSResponse {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Send SMS via ClickSend API
 */
export const sendSMS = async (options: SendSMSOptions): Promise<SMSResponse> => {
  const apiUsername = process.env.CLICKSEND_API_USERNAME;
  const apiKey = process.env.CLICKSEND_API_KEY;
  const senderId = process.env.CLICKSEND_SENDER_ID || 'KJNails';

  if (!apiUsername || !apiKey) {
    console.warn('ClickSend credentials not configured. SMS functionality will be disabled.');
    return {
      success: false,
      error: 'ClickSend not configured',
    };
  }

  try {
    // Prepare phone number - ensure it's in the right format
    let phoneNumber = options.to;
    if (!phoneNumber.startsWith('+')) {
      // Add +1 for US numbers if no country code provided
      if (phoneNumber.startsWith('1')) {
        phoneNumber = '+' + phoneNumber;
      } else if (phoneNumber.length === 10) {
        phoneNumber = '+1' + phoneNumber;
      } else {
        phoneNumber = '+' + phoneNumber;
      }
    }

    const response = await axios.post(
      `${CLICKSEND_API_URL}/sms/send`,
      {
        messages: [
          {
            body: options.body,
            to: phoneNumber,
            source: senderId,
          },
        ],
      },
      {
        auth: {
          username: apiUsername,
          password: apiKey,
        },
      }
    );

    if (response.data.data && response.data.data.messages && response.data.data.messages.length > 0) {
      const message = response.data.data.messages[0];
      return {
        success: true,
        messageId: message.message_id,
      };
    }

    return {
      success: false,
      error: 'Failed to send SMS',
    };
  } catch (error) {
    console.error('Error sending SMS via ClickSend:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Send appointment booked SMS to customer
 */
export const sendAppointmentBookedSMS = async (
  phoneNumber: string,
  customerName: string,
  appointmentDate: string,
  appointmentTime: string,
  serviceName: string
): Promise<SMSResponse> => {
  const message = `Hi ${customerName}! Your appointment at KJ Nails is confirmed for ${appointmentDate} at ${appointmentTime} (${serviceName}). We look forward to seeing you!`;

  return sendSMS({
    to: phoneNumber,
    body: message,
  });
};

/**
 * Send appointment reminder SMS to customer
 */
export const sendAppointmentReminderSMS = async (
  phoneNumber: string,
  customerName: string,
  appointmentTime: string
): Promise<SMSResponse> => {
  const message = `Hi ${customerName}! Reminder: Your KJ Nails appointment is today at ${appointmentTime}. See you soon!`;

  return sendSMS({
    to: phoneNumber,
    body: message,
  });
};

/**
 * Send appointment cancelled SMS to customer
 */
export const sendAppointmentCancelledSMS = async (
  phoneNumber: string,
  customerName: string
): Promise<SMSResponse> => {
  const message = `Hi ${customerName}! Your appointment at KJ Nails has been cancelled. Please contact us if you have any questions.`;

  return sendSMS({
    to: phoneNumber,
    body: message,
  });
};
