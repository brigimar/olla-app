import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ? NO importes createOrder de s� mismo
export async function createOrder(orderData: unknown) {
  console.log('Stub createOrder', orderData);
  return { id: 'fake-order-id', ...orderData };
}

