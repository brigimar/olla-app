// src/components/OrderStatus.tsx - Client Component
'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/lib/supabase';

interface Order {
  id: string;
  status: string;
}

export default function OrderStatus({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const supabase = useSupabase();

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
      const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
      if (data) setOrder(data);
    }
    loadOrder();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, orderId]);

  if (!order) return <div>Cargando...</div>;
  return <div>Estado de la orden: {order.status}</div>;
}
