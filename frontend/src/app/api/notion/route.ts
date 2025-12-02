import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    const data = await response.json();

    if (!data.results) {
      return NextResponse.json({ error: "No se encontraron resultados en Notion" }, { status: 500 });
    }

    const platos = data.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id, // usar el ID de Notion como PK
        producer_id: null, // ⚠️ pendiente: mapear nombre_cocinero → producer_id
        name: props.nombre?.title?.[0]?.plain_text || null,
        description: props.descripcion?.rich_text?.[0]?.plain_text || null,
        price_cents: 2000, // default o regla de negocio
        image_url: props.archivo_imagen?.files?.[0]?.file?.url || null,
        category: props.categoria?.select?.name || null,
        is_available: props.estado?.select?.name === "activo",
        preparation_time_minutes: null, // opcional
        status: props.estado?.select?.name || "active",
        rating: 0,
        city: null,
      };
    });

    const { error: supabaseError } = await supabase
      .from("dishes")
      .upsert(platos, { onConflict: "id" });

    if (supabaseError) {
      return NextResponse.json({ error: supabaseError.message }, { status: 500 });
    }

    return NextResponse.json(platos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
