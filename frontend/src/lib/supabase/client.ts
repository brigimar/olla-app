// src/lib/supabase/client.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

let browserClientSingleton: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Hook para usar Supabase en Client Components.
 * ⚠️ Solo debe usarse en componentes con "use client".
 * ⚠️ Nunca en Server Components, layout raíz sin control, o middleware.
 */
export const useSupabase = (): ReturnType<typeof createBrowserClient> => {
  if (typeof window === "undefined") {
    throw new Error(
      "useSupabase() no puede usarse en Server Components. " +
      "Asegúrate de que el componente esté marcado con 'use client'."
    );
  }

  if (!browserClientSingleton) {
    browserClientSingleton = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (process.env.NODE_ENV === "development") {
      console.log("✅ Nueva instancia singleton de Supabase Browser Client creada");
    }
  }

  return browserClientSingleton;
};
