/**
 * Type Definitions for KJ Nails Booking System
 * 
 * Use these types throughout your application for consistency
 */

/**
 * Represents a nail service offering
 */
export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  basePrice: number; // base price before add-ons
  description?: string;
  imageUrl?: string;
  category?: 'manicure' | 'pedicure' | 'extensions' | 'design' | 'removal';
}

/**
 * Design add-on for services
 */
export interface Design {
  id: string;
  name: string;
  price: number; // additional price on top of base service
  description?: string;
}

/**
 * Appointment booking record
 */
export interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  designId?: string;
  designName?: string;
  appointmentDate: string; // YYYY-MM-DD format
  appointmentTime: string; // HH:MM format
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  totalPrice: number;
  duration: number; // in minutes
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string; // ISO format
  updatedAt?: string; // ISO format
}

/**
 * Business settings
 */
export interface BusinessSettings {
  businessName: string;
  phone: string;
  email: string;
  address?: string;
  businessHours: {
    [day in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']: {
      open: string; // HH:MM
      close: string; // HH:MM
      isOpen: boolean;
    };
  };
  timezone?: string;
  smsNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
}

/**
 * Request body for creating a new appointment
 */
export interface CreateAppointmentRequest {
  service: string; // serviceId
  design?: string; // designId
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  totalPrice: number;
}

/**
 * Request body for creating a service
 */
export interface CreateServiceRequest {
  name: string;
  duration: number;
  basePrice: number;
  description?: string;
  category?: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Booking summary for display/confirmation
 */
export interface BookingSummary {
  service: Service;
  design?: Design;
  date: string;
  time: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  totalPrice: number;
  duration: number;
}

/**
 * Time slot availability
 */
export interface TimeSlot {
  time: string; // HH:MM format
  available: boolean;
  reason?: string; // e.g., "Outside business hours", "Fully booked"
}

/**
 * Availability data for a specific date
 */
export interface DateAvailability {
  date: string; // YYYY-MM-DD
  slots: TimeSlot[];
  hasAvailability: boolean;
}
