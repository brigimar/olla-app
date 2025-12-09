// src/lib/supabase/client.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

let browserClientSingleton: ReturnType<typeof createBrowserClient> | null = null;

export const useSupabase = (): ReturnType<typeof createBrowserClient> => {
  // Durante el build (SSR), retorna un mock seguro que no rompa
  if (typeof window === "undefined") {
    return {
      auth: {
        getSession: async () => ({ 
          data: { session: null }, 
          error: null 
        }),
        getUser: async () => ({ 
          data: { user: null }, 
          error: null 
        }),
        signUp: async () => ({ 
          data: { 
            user: null, 
            session: null,
            user_identities: []
          }, 
          error: null 
        }),
        signInWithPassword: async () => ({ 
          data: { user: null, session: null }, 
          error: null 
        }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ 
          data: { 
            subscription: { 
              unsubscribe: () => {} 
            } 
          } 
        }),
        resend: async () => ({ error: null }),
      },
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: (column: string, value: any) => 
            Promise.resolve({ data: [], error: null }),
          single: () => 
            Promise.resolve({ data: null, error: null }),
        }),
        insert: (values: any) => ({ 
          select: (columns?: string) => ({ 
            single: () => 
              Promise.resolve({ data: null, error: null }) 
          }) 
        }),
        upsert: (values: any, options?: any) => 
          Promise.resolve({ data: null, error: null }),
        update: (values: any) => ({ 
          eq: (column: string, value: any) => 
            Promise.resolve({ data: null, error: null }) 
        }),
      }),
      storage: {
        from: (bucket: string) => ({
          upload: async (path: string, file: File, options?: any) => ({ 
            error: null 
          }),
          getPublicUrl: (path: string) => ({ 
            data: { publicUrl: "" } 
          }),
        }),
      },
    } as unknown as ReturnType<typeof createBrowserClient>;
  }

  // En el cliente, crear el singleton real
  if (!browserClientSingleton) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "Missing Supabase environment variables. " +
        "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment."
      );
      // Retorna el mock incluso en cliente si faltan variables
      return {
        auth: {},
        from: () => ({}),
        storage: { from: () => ({}) },
      } as unknown as ReturnType<typeof createBrowserClient>;
    }

    try {
      browserClientSingleton = createBrowserClient(supabaseUrl, supabaseKey);
      
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Supabase Browser Client creado");
      }
    } catch (error) {
      console.error("Error creando cliente de Supabase:", error);
      // Retorna mock en caso de error
      return {} as ReturnType<typeof createBrowserClient>;
    }
  }

  return browserClientSingleton;
};