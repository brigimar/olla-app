"use client";

import { createBrowserClient } from "@supabase/ssr";
import { HeartHandshake } from "lucide-react";

let supabaseBrowserClient: ReturnType<typeof createBrowserClient> | null = null;

export const useSupabase = () => {
  // Durante build time (SSG), window no existe
  // Retornar un proxy vacío en vez de throw error
  if (typeof window === 'undefined') {
    // Retornar un objeto mock que no hará nada
    // Esto permite que el build pase sin errores
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signUp: async () => ({ data: null, error: null }),
        signInWithPassword: async () => ({ data: null, error: null }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ data: null, error: null }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ data: null, error: null }),
        eq: function() { return this; },
        maybeSingle: async () => ({ data: null, error: null }),
        single: async () => ({ data: null, error: null }),
      }),
    } as any;
  }

  // En el navegador, crear la instancia real
  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Supabase client instance created');
    }
  }

  return supabaseBrowserClient;
};HeartHandshake
