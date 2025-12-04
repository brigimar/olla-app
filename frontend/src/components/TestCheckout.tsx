// src/components/TestCheckout.tsx
'use client';

import { useEffect } from 'react';
import { createOrder } from '@/lib/supabase';

export default function TestCheckout() {
  useEffect(() => {
    const runTest = async () => {
      try {
       const order = await createOrder({
  client_id: "test-client-id",
  producer_id: "test-producer-id",
  status: "pending",
  subtotal_cents: 100,
  commission_cents: 10,
  total_cents: 110,
});


        console.log('✅ Checkout funciona, orden creada:', order);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('❌ Error en Checkout:', err.message);
        } else {
          console.error('❌ Error desconocido en Checkout:', err);
        }
      }
    };
    runTest();
  }, []);

  return <div>Test Checkout ejecutado (ver consola)</div>;
}
