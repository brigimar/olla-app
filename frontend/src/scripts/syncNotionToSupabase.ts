// Requiere Node.js 18+ (fetch nativo), instalar dependencias:
//   npm install @supabase/supabase-js dotenv

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar cliente Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fetchPlatos() {
  const res = await fetch(
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await res.json();

  return data.results.map((page) => {
    const props = page.properties;
    return {
      name: props.nombre?.title?.[0]?.plain_text || null,
      image_url: props.archivo_imagen?.files?.[0]?.name || null,
      category: props.categoria?.select?.name || null,
      description: props.descripcion?.rich_text?.[0]?.plain_text || null,
      is_available: props.destacado?.checkbox ?? true,
      status: props.estado?.select?.name || 'active',
      producer_name: props.nombre_cocinero?.rich_text?.[0]?.plain_text || null,
      price_cents: 2000, // valor por defecto, ajusta según tu lógica
    };
  });
}

// Resolver producer_id por nombre
async function getProducerIdByName(name) {
  if (!name) return null;
  const { data, error } = await supabase
    .from('producers')
    .select('id')
    .eq('business_name', name)
    .single();

  if (error) {
    console.error('Error buscando producer:', error.message);
    return null;
  }
  return data?.id;
}

// Upsert de un plato en Supabase
async function upsertDish(dish) {
  const producerId = await getProducerIdByName(dish.producer_name);
  if (!producerId) {
    console.warn(`No se encontró producer para ${dish.producer_name}`);
    return;
  }

  const { error } = await supabase.from('dishes').upsert(
    {
      name: dish.name,
      image_url: dish.image_url,
      category: dish.category,
      description: dish.description,
      is_available: dish.is_available,
      status: dish.status,
      price_cents: dish.price_cents,
      producer_id: producerId,
    },
    { onConflict: ['name', 'producer_id'] }
  );

  if (error) {
    console.error('Error insertando plato:', error.message);
  } else {
    console.log(`✅ Plato sincronizado: ${dish.name}`);
  }
}

// Flujo principal
async function main() {
  const platos = await fetchPlatos();
  for (const plato of platos) {
    await upsertDish(plato);
  }
}

main().catch((err) => console.error(err));
