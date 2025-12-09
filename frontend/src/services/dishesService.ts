// src/services/dishesService.ts
import { createServerClient } from "@supabase/ssr";
import { type ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

// Definir tipo para Dish
interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  producer_id: string;
  image_url?: string;
  category?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const getDishes = async (cookies: ReadonlyRequestCookies): Promise<Dish[]> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Validación de variables de entorno
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. " +
      "Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookies.getAll();
        },
        setAll(cookieList) {
          cookieList.forEach(({ name, value, options }) => {
            try {
              cookies.set(name, value, options);
            } catch (_) {
              // Silently ignore cookie setting errors in edge cases
            }
          });
        },
      },
    }
  );

  // ✅ CORRECCIÓN: Cambiar 'dishes' por 'data'
  const { data, error } = await supabase.from("dishes").select("*");
  
  if (error) {
    console.error("Error fetching dishes:", error);
    throw new Error(`Failed to fetch dishes: ${error.message}`);
  }
  
  // Asegurar que siempre devolvemos un array
  return data || [];
};