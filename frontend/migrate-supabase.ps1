# migrate-supabase.ps1
Write-Host "🚀 Iniciando migración de Supabase y React Query..."

# 1. Backup de src/lib/supabase.ts
if (Test-Path "src\lib\supabase.ts") {
    Copy-Item src\lib\supabase.ts src\lib\supabase.ts.backup -Force
    Write-Host "✅ Backup creado: src/lib/supabase.ts.backup"
}

# 2. Crear versión corregida de src/lib/supabase.ts
@'
// src/lib/supabase.ts - VERSIÓN CORRECTA
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// ✅ SOLO para uso en Client Components
export function createSupabaseClient() {
  if (typeof window === "undefined") {
    throw new Error("createSupabaseClient solo puede usarse en el cliente");
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
}

export function useSupabase() {
  return createSupabaseClient();
}

// ✅ Para Server Components
export async function getDishesFromServer(limit = 10) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.from("dishes").select("*").limit(limit);
  if (error) { console.error("Error fetching dishes:", error); return []; }
  return data;
}

export async function getOrderFromServer(orderId: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (error) { console.error("Error fetching order:", error); return null; }
  return data;
}
'@ | Out-File src/lib/supabase.ts -Encoding UTF8
Write-Host "✅ src/lib/supabase.ts actualizado"

# 3. Crear src/app/providers.tsx
@'
// src/app/providers.tsx - Client Component
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false } }
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
'@ | Out-File src/app/providers.tsx -Encoding UTF8
Write-Host "✅ src/app/providers.tsx creado"

# 4. Refactor src/app/layout.tsx
@'
// src/app/layout.tsx - Server Component
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mi Mercado - Abuelas",
  description: "Listado de productores y pedidos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
'@ | Out-File src/app/layout.tsx -Encoding UTF8
Write-Host "✅ src/app/layout.tsx refactorizado"

# 5. Actualizar src/components/Checkout.tsx
@'
// src/components/Checkout.tsx - Client Component
"use client";

import { useState } from "react";
import { useSupabase } from "@/lib/supabase";

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const supabase = useSupabase();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({ customer: "test", total: 100 })
        .select()
        .single();
      if (error) throw error;
      console.log("Orden creada:", order);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return <button onClick={handleCheckout} disabled={loading}>Checkout</button>;
}
'@ | Out-File src/components/Checkout.tsx -Encoding UTF8
Write-Host "✅ src/components/Checkout.tsx actualizado"

# 6. Actualizar src/components/OrderStatus.tsx
@'
// src/components/OrderStatus.tsx - Client Component
"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/lib/supabase";

interface Order { id: string; status: string; }

export default function OrderStatus({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const supabase = useSupabase();

  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => setOrder(payload.new as Order))
      .subscribe();

    async function loadOrder() {
      const { data } = await supabase.from("orders").select("*").eq("id", orderId).single();
      if (data) setOrder(data);
    }
    loadOrder();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, orderId]);

  if (!order) return <div>Cargando...</div>;
  return <div>Estado de la orden: {order.status}</div>;
}
'@ | Out-File src/components/OrderStatus.tsx -Encoding UTF8
Write-Host "✅ src/components/OrderStatus.tsx actualizado"

# 7. Actualizar src/services/dishesService.ts
@'
// src/services/dishesService.ts
import { getDishesFromServer } from "@/lib/supabase";

export const dishesService = {
  async getNearbyDishesFromServer(limit = 10) {
    return getDishesFromServer(limit);
  }
};
'@ | Out-File src/services/dishesService.ts -Encoding UTF8
Write-Host "✅ src/services/dishesService.ts actualizado"

# 8. Actualizar src/hooks/useAuth.ts
@'
// src/hooks/useAuth.ts - Client Component hook
"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabase();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { user, loading, signIn, signOut };
}
'@ | Out-File src/hooks/useAuth.ts -Encoding UTF8
Write-Host "✅ src/hooks/useAuth.ts actualizado"

# 9. Limpieza final
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install

Write-Host "🎉 Migración completa. Ejecuta 'npm run dev' para validar."
