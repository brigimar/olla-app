// src/components/TestCheckout.tsx
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

const createOrder = async (orderData: any) => {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();
  if (error) throw error;
  return data;
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
    } catch (e: any) {
      setError(e.message);
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
