-- supabase/functions/reveal_contact_info.sql
create or replace function public.reveal_contact_info(p_order_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order record;
  v_payment_status text;
begin
  -- Solo se ejecuta si el pago está aprobado
  select o.*, p.status as payment_status
  into v_order
  from orders o
  left join payments p on p.order_id = o.id
  where o.id = p_order_id;

  if v_order.payment_status != 'approved' then
    raise exception 'Pago no aprobado aún';
  end if;

  -- Revela dirección y teléfono solo 30 min antes del retiro
  if now() < (v_order.pickup_time - interval '30 minutes') then
    raise exception 'Contacto se revela 30 min antes';
  end if;

  -- Marca como revelado y devuelve datos sensibles
  update orders
  set contact_revealed = true
  where id = p_order_id;

  return jsonb_build_object(
    'address', v_order.producer_address,
    'phone', v_order.producer_phone,
    'notes', v_order.producer_notes
  );
end;
$$;