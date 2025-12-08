"use client";

import { createBrowserClient } from "@supabase/ssr";

let supabaseBrowserClient: ReturnType<typeof createBrowserClient> | null = null;

export const useSupabase = () => {
  // Validación: solo en cliente
  if (typeof window === 'undefined') {
    throw new Error(
      'useSupabase() solo puede usarse en Client Components. ' +
      'Para Server Components usa getServerSupabase().'
    );
  }

  // Singleton: crear solo una vez
  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Log solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Supabase client instance created');
    }
  }

  return supabaseBrowserClient;
};