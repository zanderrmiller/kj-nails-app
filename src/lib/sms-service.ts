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

  console.log('=== ClickSend SMS Debug ===');
  console.log('Username configured:', !!apiUsername);
  console.log('API Key configured:', !!apiKey);
  console.log('Sender ID:', senderId);

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

    console.log('Sending SMS to:', phoneNumber);
    console.log('Message:', options.body);
    console.log('API Endpoint:', `${CLICKSEND_API_URL}/sms/send`);

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

    console.log('ClickSend Response Status:', response.status);
    console.log('ClickSend Response Data:', JSON.stringify(response.data, null, 2));

    if (response.data.data && response.data.data.messages && response.data.data.messages.length > 0) {
      const message = response.data.data.messages[0];
      console.log('SMS sent successfully. Message ID:', message.message_id);
      return {
        success: true,
        messageId: message.message_id,
      };
    }

    console.log('No messages in response');
    return {
      success: false,
      error: 'Failed to send SMS',
    };
  } catch (error) {
    console.error('Error sending SMS via ClickSend:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    // Log axios error details if available
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('Response status:', axiosError.response?.status);
      console.error('Response data:', JSON.stringify(axiosError.response?.data, null, 2));
    }
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
  serviceName: string,
  appointmentId?: string
): Promise<SMSResponse> => {
  // Format date to readable format (e.g., "Dec 30")
  const date = new Date(`${appointmentDate}T00:00:00`);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  // Convert 24-hour time to 12-hour format (e.g., "15:30:00" -> "3:30 PM")
  const [hours, minutes] = appointmentTime.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  const formattedTime = `${formattedHour}:${minutes} ${ampm}`;
  
  // Build message - start with basic message, add link if available
  let message = `Hi ${customerName}! Your appointment with KJ Nails is booked for ${formattedDate} at ${formattedTime} ${serviceName}.\nKinsey will confirm appointment and pricing soon!`;
  
  if (appointmentId) {
    message += `\nManage: https://kj-nails-app.vercel.app/customer/appointment/${appointmentId}`;
  }

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

/**
 * Send appointment confirmation request to technician
 */
export const sendTechnicianConfirmationSMS = async (
  phoneNumber: string,
  customerName: string,
  appointmentDate: string,
  appointmentTime: string,
  serviceName: string,
  confirmationLink: string
): Promise<SMSResponse> => {
  const date = new Date(`${appointmentDate}T00:00:00`);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  const [hours, minutes] = appointmentTime.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  const formattedTime = `${formattedHour}:${minutes} ${ampm}`;

  const message = `New appointment: ${customerName} on ${formattedDate} at ${formattedTime} for ${serviceName}. Confirm: ${confirmationLink}`;

  return sendSMS({
    to: phoneNumber,
    body: message,
  });
};

/**
 * Send appointment confirmation to customer (after technician approves)
 */
export const sendAppointmentConfirmedSMS = async (
  phoneNumber: string,
  customerName: string,
  appointmentDate: string,
  appointmentTime: string,
  finalPrice: number
): Promise<SMSResponse> => {
  const date = new Date(`${appointmentDate}T00:00:00`);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  const [hours, minutes] = appointmentTime.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  const formattedTime = `${formattedHour}:${minutes} ${ampm}`;

  const message = `Hi ${customerName}! Your appointment with KJ Nails is confirmed for ${formattedDate} at ${formattedTime}. Total: $${finalPrice.toFixed(2)}. See you soon!`;

  return sendSMS({
    to: phoneNumber,
    body: message,
  });
};

/**
 * Send appointment edit notification to technician (new confirmation needed)
 */
export const sendAppointmentEditedSMS = async (
  phoneNumber: string,
  customerName: string,
  appointmentDate: string,
  appointmentTime: string,
  serviceName: string,
  confirmationLink: string
): Promise<SMSResponse> => {
  const date = new Date(`${appointmentDate}T00:00:00`);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  const [hours, minutes] = appointmentTime.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  const formattedTime = `${formattedHour}:${minutes} ${ampm}`;

  const message = `UPDATE: ${customerName}'s appointment rescheduled to ${formattedDate} at ${formattedTime} for ${serviceName}. Review changes: ${confirmationLink}`;

  return sendSMS({
    to: phoneNumber,
    body: message,
  });
};

/**
 * Send appointment cancellation notification to technician
 */
export const sendAppointmentCancelledToTechnicianSMS = async (
  phoneNumber: string,
  customerName: string,
  appointmentDate: string,
  appointmentTime: string,
  serviceName: string
): Promise<SMSResponse> => {
  const date = new Date(`${appointmentDate}T00:00:00`);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  const [hours, minutes] = appointmentTime.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  const formattedTime = `${formattedHour}:${minutes} ${ampm}`;

  const message = `CANCELLED: ${customerName}'s appointment on ${formattedDate} at ${formattedTime} for ${serviceName} has been cancelled.`;

  return sendSMS({
    to: phoneNumber,
    body: message,
  });
};
