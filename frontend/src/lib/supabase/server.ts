import {
  type CookieMethodsServer,
  createServerClient,
} from "@supabase/ssr";
import { type ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export function getServerSupabase(cookies: ReadonlyRequestCookies) {
  const cookieStore: CookieMethodsServer = {
    getAll() {
      return cookies.getAll();
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        try {
          cookies.set(name, value, options);
        } catch (_) {
          // Silently ignore if cookies are not mutable (e.g., in some edge cases)
          // Usamos '_' para indicar que el parámetro del error no se usa
        }
      });
    },
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required"
    );
  }

  return createServerClient(supabaseUrl, supabaseKey, { cookies: cookieStore });
}
