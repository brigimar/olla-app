// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Devuelve una instancia de Supabase para usar en servicios o middleware (server-side).
 * Recibe cookies para mantener sesión en SSR.
 */
export function getServerSupabase(cookies: any): SupabaseClient {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ usar Service Role Key solo en server
    { cookies }
  );
}
