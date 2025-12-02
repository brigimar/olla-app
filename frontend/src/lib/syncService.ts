import { Client } from "@notionhq/client";
import { SupabaseClient } from "@supabase/supabase-js";

export async function syncDishesService(notion: Client, supabase: SupabaseClient) {
  try {
    console.log("🔄 Iniciando sincronización de Notion a Supabase...");

    // 1. Consultar Notion
    const notionResponse = await notion.request({
  path: `/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
  method: "POST",
});


    // 2. Procesar y transformar los datos
    const dishesToUpsert = notionResponse.results.map((page: any) => {
      return {
        id_plato: page.id,
        nombre: page.properties.Nombre?.title?.[0]?.plain_text || "",
        precio: page.properties.Precio?.number || 0,
        // ⚡ Agregá aquí el resto de campos que quieras mapear
      };
    });

    // 3. Ejecutar Upsert en Supabase
    const { error } = await supabase.from("dishes").upsert(dishesToUpsert);

    if (error) {
      throw new Error(`Error al insertar en Supabase: ${error.message}`);
    }

    console.log(`✅ Sincronización completa. Platos procesados: ${notionResponse.results.length}`);
    return { success: true, message: `Sincronizados ${notionResponse.results.length} platos.` };
  } catch (error: any) {
    console.error("❌ Fallo en el servicio de sincronización:", error.message);
    throw error;
  }
}
