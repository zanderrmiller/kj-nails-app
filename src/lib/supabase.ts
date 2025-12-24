import { createClient } from "@supabase/supabase-js";

let supabaseClient: ReturnType<typeof createClient> | null = null;
let serviceRoleClient: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

export function getServiceRoleSupabase() {
  if (serviceRoleClient) {
    return serviceRoleClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  serviceRoleClient = createClient(supabaseUrl, serviceRoleKey);
  return serviceRoleClient;
}

// Type definitions
export interface AvailabilityBlock {
  id: string;
  date: string; // YYYY-MM-DD format
  reason: string; // "blocked", "booked", etc.
  createdAt: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm format
  duration: number; // minutes
  addons: string[]; // JSON array of add-on names
  totalPrice: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  nail_art_notes?: string;
  nail_art_images_count?: number;
  nail_art_image_urls?: string[];
}

export interface Service {
  id: string;
  name: string;
  duration: number; // minutes
  price: number;
  createdAt: string;
}
