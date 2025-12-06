import { createClient } from '@supabase/supabase-js';
import { Order } from '@/types/order';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function createOrder(orderData: Order) {
  const { data, error } = await supabase.from('orders').insert(orderData);

  if (error) throw error;
  return data;
}
