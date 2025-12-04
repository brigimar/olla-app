// src/components/OrderStatus.tsx - Client Component
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  status: string;
}

export default function OrderStatus({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => setOrder(payload.new as Order)
      )
      .subscribe();

    async function loadOrder() {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status') // ✅ seleccionamos solo lo necesario
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('❌ Error cargando orden:', error.message);
        return;
      }
      if (data) setOrder(data as Order);
    }

    loadOrder();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (!order) return <div>Cargando...</div>;
  return <div>Estado de la orden: {order.status}</div>;
}
