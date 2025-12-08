'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

// Definimos el tipo de orden
interface OrderData {
  item: string;
  quantity: number;
  price_cents: number;
}

interface Order {
  id: string;
  item: string;
  quantity: number;
  price_cents: number;
}

const createOrder = async (orderData: OrderData): Promise<Order> => {
  const { data, error } = await supabase.from('orders').insert(orderData).select().single();
  if (error) throw error;
  return data as Order;
};

export default function TestCheckout() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCheckout = async () => {
    setError(null);
    setSuccess(null);
    try {
      const order = await createOrder({
        item: 'Plato de prueba',
        quantity: 1,
        price_cents: 1000,
      });
      setSuccess(`Orden creada con ID: ${order.id}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error inesperado al crear la orden';
      setError(message);
    }
  };

  return (
    <div>
      <button onClick={handleCheckout}>Checkout</button>
      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}
    </div>
  );
}
