// src/services/dishesService.ts
import { createServerClient } from "@supabase/ssr";

export const getDishesByProducer = async (producerId: string, cookies: any) => {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies }
  );

  const { data, error } = await supabase
    .from("dishes")
    .select("*")
    .eq("producer_id", producerId);

  if (error) throw error;
  return data;
};
