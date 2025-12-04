import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ? NO importes createOrder de s� mismo
// src/lib/supabase.ts
export async function createOrder(orderData: Record<string, any>) {
  console.log('Stub createOrder', orderData);
  return { id: 'fake-order-id', ...orderData };
}

