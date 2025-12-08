import { createServerClient } from "@supabase/ssr";
import type { Session, User } from "@supabase/supabase-js";

export async function requireAuth(cookies: any) {
  // Inicializar cliente server-side
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ usar la Service Role Key en server
    { cookies }
  );

  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);

  const user: User | undefined = data?.session?.user;
  if (!user) throw new Error("Unauthorized");

  return user;
}
