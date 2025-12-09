// src/services/auth.ts
import { type ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { type Session } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

export const getSession = async (
  cookies: ReadonlyRequestCookies
): Promise<Session | null> => {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookies.getAll();
          },
          setAll(cookieList) {
            cookieList.forEach(({ name, value, options }) =>
              cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // ✅ Corrección: usar `data: { session }`
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error obteniendo sesión:", error);
      return null;
    }
    return session;
  } catch (error) {
    console.error("Error inesperado en getSession:", error);
    return null;
  }
};
