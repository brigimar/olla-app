// src/components/TestCheckout.tsx
'use client';

import { useEffect } from 'react';
import { createOrder } from '@/lib/supabase';

export default function TestCheckout() {
  useEffect(() => {
    const runTest = async () => {
      try {
        const order = await createOrder({ customer: 'test-user', total: 100 });
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
