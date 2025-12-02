// src/lib/supabase.ts - VERSI CORRECTA
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL! || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || 'placeholder-anon-key';

// âœ… SOLO para uso en Client Components
export function createSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('createSupabaseClient solo puede usarse en el cliente');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export function useSupabase() {
  return createSupabaseClient();
}

// âœ… Para Server Components
export async function getDishesFromServer(limit = 10) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.from('dishes').select('*').limit(limit);
  if (error) {
    console.error('Error fetching dishes:', error);
    return [];
  }
  return data;
}

export async function getOrderFromServer(orderId: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }
  return data;
}
