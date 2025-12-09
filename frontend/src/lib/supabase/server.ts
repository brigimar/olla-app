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
        } catch (e) {
          // Silently ignore if cookies are not mutable (e.g., in some edge cases)
        }
      });
    },
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieStore }
  );
}