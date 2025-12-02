import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_PRODUCER_ID = process.env.DEFAULT_PRODUCER_ID;

export async function GET() {
  try {
    // ███ 1) Obtener datos de Notion
    const response = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    const data = await response.json();

    if (!data.results) {
      return NextResponse.json(
        { error: 'No se encontraron resultados en Notion' },
        { status: 500 }
      );
    }

    // ███ 2) Mapear cada plato
    const platosPromises = data.results.map(async (page: any) => {
      const props = page.properties;

      const nombreCocinero = props.nombre_cocinero?.rich_text?.[0]?.plain_text?.trim() || null;

      let producer_id = DEFAULT_PRODUCER_ID;

      // ███ 3) Si tiene nombre de cocinero → intentar encontrar producer
      if (nombreCocinero) {
        const { data: producer, error: producerError } = await supabase
          .from('producers')
          .select('id')
          .eq('name', nombreCocinero)
          .single();

        if (producer) {
          producer_id = producer.id; // encontrado
        }
      }

      // ███ 4) No permitir null
      if (!producer_id) {
        throw new Error('DEFAULT_PRODUCER_ID no configurado y no se encontró producer.');
      }

      return {
        id: page.id,
        producer_id,
        name: props.nombre?.title?.[0]?.plain_text || 'Sin nombre',
        description: props.descripcion?.rich_text?.[0]?.plain_text || null,
        price_cents: 2000,
        image_url: props.archivo_imagen?.files?.[0]?.file?.url || null,
        category: props.categoria?.select?.name || null,
        is_available: props.estado?.select?.name === 'activo',
        preparation_time_minutes: null,
        status: props.estado?.select?.name?.toLowerCase() === 'activo' ? 'active' : 'inactive',
        rating: 0,
        city: null,
      };
    });

    const platos = await Promise.all(platosPromises);

    // ███ 5) Guardar en Supabase
    const { error: supabaseError } = await supabase
      .from('dishes')
      .upsert(platos, { onConflict: 'id' });

    if (supabaseError) {
      return NextResponse.json({ error: supabaseError.message }, { status: 500 });
    }

    return NextResponse.json(platos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
