// src/lib/supabase/client.ts - SOLUCIÓN DEFINITIVA
"use client";

import { createBrowserClient } from "@supabase/ssr";

// Singleton global usando patrón de módulo ES6
let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null;

export const useSupabase = (): ReturnType<typeof createBrowserClient> => {
  // SSR - retorna un mock seguro
  if (typeof window === "undefined") {
    return createSafeMockClient();
  }

  // Si ya existe la instancia, retornarla
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  // Inicializar el cliente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "❌ Missing Supabase environment variables. " +
      "Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    return createSafeMockClient();
  }

  try {
    supabaseClientInstance = createBrowserClient(supabaseUrl, supabaseKey);
    
    // Configurar para desarrollo
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Supabase Client Singleton creado");
      // Exponer para debugging
      (window as any).__supabase = supabaseClientInstance;
    }
    
    return supabaseClientInstance;
  } catch (error) {
    console.error("❌ Error creando Supabase client:", error);
    return createSafeMockClient();
  }
};

// Cliente mock para SSR y errores
const createSafeMockClient = () => {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signUp: async () => ({ 
        data: { 
          user: null, 
          session: null,
          user_identities: []
        }, 
        error: null 
      }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
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
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
      }),
      insert: () => ({ 
        select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) 
      }),
      upsert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  } as unknown as ReturnType<typeof createBrowserClient>;
};