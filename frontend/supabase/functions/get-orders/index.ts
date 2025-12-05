// /supabase/functions/get-orders/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  // 1. Extract user
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Fetch user profile
  const { data: profile } = await supabase
    .from("producers")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "client";

  // 3. Build secure query
  const query = supabase.from("orders").select(`
    id,
    status,
    total,
    client_id,
    producer_id,
    created_at,
    order_items (*)
  `);

  // client → solo sus órdenes
  if (role === "client") query.eq("client_id", user.id);

  // producer → órdenes donde es dueño de los platos
  if (role === "producer") query.eq("producer_id", user.id);

  // admin → todas
  if (role === "admin") { /* sin filtros */ }

  const { data, error } = await query;
  if (error) {
    return new Response(JSON.stringify(error), { status: 400 });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});
