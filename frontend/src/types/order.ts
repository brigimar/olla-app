import { CartItem } from "./cart";

export type OrderStatus = "pending" | "paid" | "cancelled";

export interface Order {
  id?: string;            // generado por Supabase
  user_id: string;        // referencia al usuario
  items: CartItem[];      // productos del carrito
  total: number;          // monto total
  status: OrderStatus;    // estado de la orden
  created_at?: string;    // timestamp opcional
}
