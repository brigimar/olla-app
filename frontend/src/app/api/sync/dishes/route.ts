// src/app/api/sync/dishes/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    // Seguridad opcional con SERVICE_TOKEN
    const token = new URL(req.url).searchParams.get('token');
    if (token !== process.env.SERVICE_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page_size: 50 }), // opcional: limitar resultados
      }
    );

    }


    const mapped = response.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        name: props.nombre?.title?.[0]?.plain_text ?? 'Sin nombre',
        description: props.descripción?.rich_text?.[0]?.plain_text ?? null,
        image_url:
          props.archivo_imagen?.files?.[0]?.file?.url ||
          props.archivo_imagen?.files?.[0]?.external?.url ||
          null,
        category: props.categoría?.select?.name ?? null,
        preparation_time_minutes: props['tiempo_preparación']?.number ?? null,
        rating: props.destacado?.checkbox ? 5 : 0,
        is_available: props.estado?.select?.name === 'activo',
        status: 'active',
      };
    });

    // 3. Upsert en Supabase
    const { data, error } = await supabaseAdmin.from('dishes').upsert(mapped, { onConflict: 'id' });

    if (error) {
      console.error('[Sync] Error Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ synced: data });
  } catch (err: any) {
    console.error('[Sync] Excepción capturada:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
