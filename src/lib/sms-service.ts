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
 * Send SMS via Twilio
 */
export const sendSMS = async (options: SendSMSOptions): Promise<SMSResponse> => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  console.log('=== Twilio SMS Debug ===');
  console.log('Account SID configured:', !!accountSid);
  console.log('Auth Token configured:', !!authToken);
  console.log('Twilio phone number:', twilioPhoneNumber);

  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.warn('Twilio credentials not configured. SMS functionality will be disabled.');
    return {
      success: false,
      error: 'Twilio not configured',
    };
  }

  try {
    // Prepare phone number - ensure it's in E.164 format
    let phoneNumber = options.to;
    
    // Remove all spaces and dashes from phone number
    phoneNumber = phoneNumber.replace(/[\s\-()]/g, '');
    
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
    console.log('From:', twilioPhoneNumber);
    console.log('Message:', options.body);

    // Use Twilio REST API
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(accountSid + ':' + authToken).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioPhoneNumber,
        To: phoneNumber,
        Body: options.body,
      }).toString(),
    });

    const data = await response.json() as any;

    console.log('Twilio Response Status:', response.status);
    console.log('Twilio Response Data:', JSON.stringify(data, null, 2));

    if (response.ok && data.sid) {
      console.log('SMS sent successfully. Message SID:', data.sid);
      return {
        success: true,
        messageId: data.sid,
      };
    }

    console.log('Error response from Twilio');
    return {
      success: false,
      error: data.message || 'Failed to send SMS',
    };
  } catch (error) {
    console.error('Error sending SMS via Twilio:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
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
  basePrice: number,
  appointmentId?: string
): Promise<SMSResponse> => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kj-nails-app.vercel.app';
  
  // Get short code from appointment ID
  let shortCode = '';
  if (appointmentId) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      const { data } = await supabase
        .from('short_codes')
        .select('code')
        .eq('appointment_id', appointmentId)
        .single();

      shortCode = data?.code || '';
    } catch (error) {
      console.error('Error getting short code:', error);
    }
  }
  
  const appointmentUrl = shortCode ? `${baseUrl}/a/${shortCode}` : '';
  
  // Format date nicely (e.g., "Mon, Jan 6")
  const dateObj = new Date(appointmentDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  
  let message = `Hi ${customerName}! Your appointment at KJ Nails:\n\n`;
  message += `Date: ${formattedDate} at ${appointmentTime}\n`;
  message += `Service: ${serviceName}\n`;
  message += `Price: ~$${basePrice}\n\n`;
  message += `Appointment will be confirmed soon!`;
  
  if (appointmentUrl) {
    message += `\n\nReschedule/Cancel: ${appointmentUrl}`;
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
 * Send appointment confirmation to customer (after technician approves)
 */
export const sendAppointmentConfirmedSMS = async (
  phoneNumber: string,
  customerName: string,
  appointmentDate: string,
  appointmentTime: string,
  finalPrice: number,
  appointmentId?: string
): Promise<SMSResponse> => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kj-nails-app.vercel.app';
  
  // Get short code from appointment ID
  let shortCode = '';
  if (appointmentId) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      const { data } = await supabase
        .from('short_codes')
        .select('code')
        .eq('appointment_id', appointmentId)
        .single();

      shortCode = data?.code || '';
    } catch (error) {
      console.error('Error getting short code:', error);
    }
  }
  
  const appointmentUrl = shortCode ? `${baseUrl}/a/${shortCode}` : '';
  
  // Format date nicely (e.g., "Mon, Jan 6")
  const dateObj = new Date(appointmentDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  
  let message = `Your Appointment with KJNails is Confirmed!\n\n`;
  message += `Date: ${formattedDate} at ${appointmentTime}\n`;
  message += `Final Estimate: $${finalPrice}\n\n`;
  message += `See you soon!`;
  
  if (appointmentUrl) {
    message += `\n\nReschedule/Cancel: ${appointmentUrl}`;
  }

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
  confirmationLink: string,
  totalDuration?: number
): Promise<SMSResponse> => {
  // Format date nicely (e.g., "Mon, Jan 6")
  const dateObj = new Date(appointmentDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  
  // Parse appointment time to calculate end time if duration is provided
  let timeRange = appointmentTime;
  if (totalDuration) {
    const AVAILABLE_TIMES = [
      '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
      '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM',
    ];
    
    const startIndex = AVAILABLE_TIMES.indexOf(appointmentTime);
    const slotsNeeded = Math.ceil(totalDuration / 30);
    const endIndex = Math.min(startIndex + slotsNeeded, AVAILABLE_TIMES.length - 1);
    const endTime = AVAILABLE_TIMES[endIndex];
    timeRange = `${appointmentTime} - ${endTime}`;
  }
  
  const message = `UPDATE: ${customerName}'s ${serviceName} appointment rescheduled:\n${formattedDate} ${timeRange}\n\nReview: ${confirmationLink}`;

  return sendSMS({
    to: phoneNumber,
    body: message,
  });
};

/**
 * Send appointment rescheduled confirmation to customer with new details
 */
export const sendAppointmentRescheduledCustomerSMS = async (
  phoneNumber: string,
  customerName: string,
  appointmentDate: string,
  appointmentTime: string,
  serviceName: string,
  basePrice: number,
  appointmentId?: string
): Promise<SMSResponse> => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kj-nails-app.vercel.app';
  
  // Get short code from appointment ID
  let shortCode = '';
  if (appointmentId) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      const { data } = await supabase
        .from('short_codes')
        .select('code')
        .eq('appointment_id', appointmentId)
        .single();

      shortCode = data?.code || '';
    } catch (error) {
      console.error('Error getting short code:', error);
    }
  }
  
  const appointmentUrl = shortCode ? `${baseUrl}/a/${shortCode}` : '';
  
  // Format date nicely (e.g., "Mon, Jan 6")
  const dateObj = new Date(appointmentDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  
  let message = `Hi ${customerName}! Your appointment has been rescheduled:\n\n`;
  message += `Date: ${formattedDate} at ${appointmentTime}\n`;
  message += `Service: ${serviceName}\n`;
  message += `Price: ~$${basePrice}\n\n`;
  message += `Awaiting confirmation from KJ Nails.`;
  
  if (appointmentUrl) {
    message += `\n\nChange or cancel: ${appointmentUrl}`;
  }

  return sendSMS({
    to: phoneNumber,
    body: message,
  });
};

/**
 * Send new appointment booking notification to technician
 */
export const sendAppointmentBookedToTechnicianSMS = async (
  phoneNumber: string,
  customerName: string,
  appointmentDate: string,
  appointmentTime: string,
  serviceName: string,
  totalDuration: number
): Promise<SMSResponse> => {
  // Format date nicely (e.g., "Mon, Jan 6")
  const dateObj = new Date(appointmentDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  
  // Parse appointment time to calculate end time
  const AVAILABLE_TIMES = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
    '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM',
  ];
  
  const startIndex = AVAILABLE_TIMES.indexOf(appointmentTime);
  const slotsNeeded = Math.ceil(totalDuration / 30);
  const endIndex = Math.min(startIndex + slotsNeeded, AVAILABLE_TIMES.length - 1);
  const endTime = AVAILABLE_TIMES[endIndex];
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kj-nails-app.vercel.app';
  const pendingLink = `${baseUrl}/pending`;
  
  const message = `NEW APPOINTMENT:\n${customerName}\n${formattedDate} ${appointmentTime} - ${endTime}\n${serviceName}\n\nConfirm: ${pendingLink}`;

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
  serviceName: string,
  totalDuration: number
): Promise<SMSResponse> => {
  // Format date nicely (e.g., "Mon, Jan 6")
  const dateObj = new Date(appointmentDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  
  // Parse appointment time to calculate end time
  const AVAILABLE_TIMES = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
    '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM',
  ];
  
  const startIndex = AVAILABLE_TIMES.indexOf(appointmentTime);
  const slotsNeeded = Math.ceil(totalDuration / 30);
  const endIndex = Math.min(startIndex + slotsNeeded, AVAILABLE_TIMES.length - 1);
  const endTime = AVAILABLE_TIMES[endIndex];
  
  const message = `Appointment Cancelation:\n${customerName}\n${formattedDate} ${appointmentTime} - ${endTime}`;

  return sendSMS({
    to: phoneNumber,
    body: message,
  });
};

/**
 * Send appointment rejection notification to customer
 */
export const sendAppointmentRejectedSMS = async (
  phoneNumber: string,
  customerName: string
): Promise<SMSResponse> => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kj-nails-app.vercel.app';
  
  const message = `Hi ${customerName}, sorry we're unable to confirm your appointment at this time. Please feel free to rebook at your convenience: ${baseUrl}`;

  return sendSMS({
    to: phoneNumber,
    body: message,
  });
};
