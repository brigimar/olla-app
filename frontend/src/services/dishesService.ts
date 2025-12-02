// src/services/dishesService.ts
import { Dish } from "@/types/database.types";

export async function getDishesFromNotion(): Promise<Dish[]> {
  const res = await fetch(`https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
  });

  if (!res.ok) throw new Error(`Notion API error: ${res.status}`);

  const data = await res.json();

  return data.results.map((page: any) => ({
    id: page.id,
    name: page.properties.nombre?.title?.[0]?.plain_text || "",
    description: page.properties.descripción?.rich_text?.[0]?.plain_text || "",
    price_cents: (page.properties.calorías?.number || 0) * 100, // ejemplo: usar calorías como precio
    image_url: page.properties.archivo_imagen?.files?.[0]?.file?.url || "",
    cook_name: page.properties.nombre_cocinero?.rich_text?.[0]?.plain_text || "",
    city: page.properties.categoría?.select?.name || "",
    rating: page.properties.nivel_picante?.number || 0,
    status: page.properties.estado?.select?.name || "inactive",
    badge: page.properties.destacado?.checkbox ? "Destacado" : null,
    created_at: page.created_time,
  }));
}
