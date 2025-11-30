create or replace function reveal_contact_info(order_id uuid)
returns void
language plpgsql
security definer
as .\reorganizar_proyecto.ps1
begin
  update orders
  set contact_visible = true
  where id = order_id;
end;
.\reorganizar_proyecto.ps1;
