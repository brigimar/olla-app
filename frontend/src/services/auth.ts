// src/services/auth.ts
import { createServerClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";

export const getSession = async (cookies: any): Promise<Session | null> => {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ usar Service Role Key en server
    { cookies }
  );

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};
