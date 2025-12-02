// backend/app/api/sync/dishes/route.ts
import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function GET(req: Request) {
  // Seguridad opcional con SERVICE_TOKEN
  const token = new URL(req.url).searchParams.get("token");
  if (token !== process.env.SERVICE_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID!,
  });

  const mapped = response.results.map((page: any) => ({
  id: page.id,
  name: page.properties.nombre?.title[0]?.plain_text,
  description: page.properties.descripción?.rich_text[0]?.plain_text,
  image_url: page.properties.archivo_imagen?.files?.[0]?.file?.url,
  category: page.properties.categoría?.select?.name,
  preparation_time_minutes: page.properties["tiempo_preparación"]?.number,
  rating: page.properties.destacado?.checkbox ? 5 : 0,
  is_available: page.properties.estado?.select?.name === "activo",
  status: "active",
}));


  const { data, error } = await supabaseAdmin
    .from("dishes")
    .upsert(mapped, { onConflict: "id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ synced: data });
}
