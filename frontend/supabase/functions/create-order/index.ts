import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } },
  });

  const body = await req.json().catch(() => null);
  if (!body) return new Response('Invalid JSON', { status: 400 });

  const { items } = body;
  if (!Array.isArray(items) || items.length === 0)
    return new Response('Items missing', { status: 400 });

  // Validate user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // Check user is client
  const { data: profile } = await supabase
    .from('producers')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role === 'producer') {
    return new Response('Producers cannot create orders', { status: 403 });
  }

  // Step 1: Create order
  const { data: order, error: err1 } = await supabase
    .from('orders')
    .insert({ client_id: user.id })
    .select()
    .single();

  if (err1) return new Response(JSON.stringify(err1), { status: 400 });

  // Step 2: Insert items (RLS will enforce client ownership)
  const itemsPayload = items.map((i) => ({
    order_id: order.id,
    dish_id: i.dish_id,
    qty: i.qty,
  }));

  const { error: err2 } = await supabase.from('order_items').insert(itemsPayload);

  if (err2) return new Response(JSON.stringify(err2), { status: 400 });

  return new Response(JSON.stringify({ ok: true, order_id: order.id }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
