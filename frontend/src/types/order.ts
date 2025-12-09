// order.ts
import { GeoPoint } from './geo';

export type OrderStatus = 'pending' | 'paid' | 'cancelled';
export interface Order {
  id?: string; // Supabase lo genera
  client_id: string;
  producer_id: string;
  status: OrderStatus;
  subtotal_cents: number;
  commission_cents: number;
  total_cents: number;
  created_at?: string; // Supabase lo genera
  updated_at?: string; // Supabase lo genera
  delivery_address_point?: GeoPoint | null; // ✅ ya no es unknown
  pickup_time?: string | null;
  paid_at?: string | null;
  address_revealed_at?: string | null;
  delivery_address?: string | null;
}




