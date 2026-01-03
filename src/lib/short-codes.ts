/**
 * Generate a random short code for appointments (6-8 characters)
 * Uses alphanumeric characters (A-Z, a-z, 0-9)
 */
export function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 8;
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

/**
 * Create a short code for an appointment in Supabase
 */
export async function createShortCode(appointmentId: string): Promise<string | null> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    let code = generateShortCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Keep trying to generate unique codes (max 10 attempts)
    while (attempts < maxAttempts) {
      const { error } = await supabase
        .from('short_codes')
        .insert({ code, appointment_id: appointmentId });

      if (!error) {
        console.log(`✅ Created short code ${code} for appointment ${appointmentId}`);
        return code;
      }

      if (error.code === '23505') {
        // Unique constraint violation - code already exists, try again
        code = generateShortCode();
        attempts++;
        continue;
      }

      // Other error
      console.error('Error creating short code:', error);
      return null;
    }

    console.error('Failed to create short code after 10 attempts');
    return null;
  } catch (error) {
    console.error('Error in createShortCode:', error);
    return null;
  }
}
