"use client";
import { useSupabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface Order {
  id: string;
  status: string;
}

export default function OrderStatus({ orderId }: { orderId: string }) {
  const supabase = useSupabase();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload: RealtimePostgresChangesPayload<Order>) => {
          if (payload.new) {
            setOrder(payload.new as Order);
          }
        }
      )
      .subscribe();

    async function loadOrder() {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status")
        .eq("id", orderId)
        .single();

      if (error) {
        console.error("? Error cargando orden:", error.message);
        return;
      }
      if (data) setOrder(data as Order);
    }

    loadOrder();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

  if (!order) return <div>Cargando...</div>;
  return <div>Estado de la orden: {order.status}</div>;
}

