import { Order } from "../types/order";

export async function createOrder(orderData: Order) {
  const { data, error } = await supabase
    .from("orders")
    .insert(orderData);

  if (error) throw error;
  return data;
}
