-- Bloquea automáticamente cualquier número de celular argentino en el chat
create or replace function block_phone_numbers()
returns trigger
language plpgsql
as $$
declare
  phone_pattern text := '(?:\+54|0)? ?(?:11|[2368]\d)(?:\s?\d){8,10}';
begin
  if NEW.message ilike '%' || '11' || '%' 
     or NEW.message ~* phone_pattern
     or NEW.message ~* '\d{8,11}'
     or NEW.message ilike '%whatsapp%'
     or NEW.message ilike '%celular%'
     or NEW.message ilike '%telefono%' then

    NEW.message := regexp_replace(NEW.message, '\+?\d{8,15}', '•••••••••• (usá el chat de la app ❤️)', 'g');
    NEW.contains_blocked_info := true;
  end if;

  return NEW;
end;
$$;

-- Aplicar trigger
drop trigger if exists trg_block_phones on chat_messages;
create trigger trg_block_phones
  before insert or update on chat_messages
  for each row
  execute function block_phone_numbers();