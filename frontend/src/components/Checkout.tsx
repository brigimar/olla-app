// src/components/Checkout.tsx - Client Component
'use client';

import { useState } from 'react';
import { supabase, createClient } from '@/lib/supabase/client';

export default function Checkout() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({ customer: 'test', total: 100 })
        .select()
        .single();
      if (error) throw error;
      console.log('Orden creada:', order);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleCheckout} disabled={loading}>
      Checkout
    </button>
  );
}
