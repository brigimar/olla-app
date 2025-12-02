import { Client } from "@notionhq/client";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv"; // CAMBIO AQUÍ: Importación más compatible
import path from "path";

// Asegura que lea el .env desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// 1. Inicialización de Clientes
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

// Helper para descargar imagen desde URL y convertir a ArrayBuffer
async function downloadImage(url: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error fetching image: ${response.statusText}`);
    return await response.arrayBuffer();
  } catch (error) {
    console.error("Error descargando imagen:", error);
    return null;
  }
}

async function syncDishes() {
  console.log("🔄 Iniciando sincronización de platos...");

  try {
    // 2. Leer registros de Notion
    const response = await (notion.databases as any).query({
    database_id: DATABASE_ID,
});
    const dishesToUpsert = [];

    for (const page of response.results as any[]) {
      const props = page.properties;
      const pageId = page.id;

      // 3. Extracción y Mapeo de Datos
      // Nota: Notion devuelve estructuras anidadas complejas.
      
      const nombre = props["nombre"]?.title?.[0]?.plain_text || "Sin nombre";
      const descripcion = props["descripción"]?.rich_text?.[0]?.plain_text || "";
      const categoria = props["categoría"]?.select?.name || "General";
      const calorias = props["calorías"]?.number || 0;
      const destacado = props["destacado"]?.checkbox || false;
      const dificultad = props["dificultad"]?.select?.name || "Media";
      const estado = props["estado"]?.select?.name; // Activo/Inactivo
      const isAvailable = estado === "Activo";
      
      const chefName = props["nombre_cocinero"]?.rich_text?.[0]?.plain_text || "";
      const chefBio = props["biografía_cocinero"]?.rich_text?.[0]?.plain_text || "";
      const ingredientes = props["ingredientes"]?.rich_text?.[0]?.plain_text || "";
      const historia = props["historia"]?.rich_text?.[0]?.plain_text || "";
      const nivelPicante = props["nivel_picante"]?.rich_text?.[0]?.plain_text || "";
      const raciones = props["raciones"]?.rich_text?.[0]?.plain_text || "";
      const tiempoPrep = props["tiempo_preparación"]?.number || 0;

      // Construcción de etiquetas (Tags)
      const tagsArray = props["etiquetas"]?.multi_select?.map((t: any) => t.name) || [];
      const tempTag = props["etiqueta_temporada"]?.rich_text?.[0]?.plain_text;
      const isVegan = props["vegano"]?.checkbox;
      const isVeggie = props["vegetariano"]?.checkbox;

      const finalTags = [
        ...tagsArray,
        tempTag,
        isVegan ? "Vegano" : null,
        isVeggie ? "Vegetariano" : null,
      ].filter(Boolean); // Eliminar nulls/undefined

      // 4. Procesamiento de Imagen (Notion File -> Supabase Storage)
      let publicImageUrl = null;
      const fileObj = props["archivo_imagen"]?.files?.[0];
      
      if (fileObj) {
        // Notion devuelve URLs firmadas de AWS que expiran. 
        // Debemos descargarla y subirla a Supabase.
        const notionFileUrl = fileObj.file?.url || fileObj.external?.url;
        
        if (notionFileUrl) {
          const imageBuffer = await downloadImage(notionFileUrl);
          
          if (imageBuffer) {
            const fileName = `${pageId}/${fileObj.name || 'cover.jpg'}`;
            
            // Subir a Supabase Storage (sobrescribe si existe gracias al upsert implícito o configuración)
            const { error: uploadError } = await supabase.storage
              .from("dishes")
              .upload(fileName, imageBuffer, {
                contentType: "image/jpeg", // Ajustar dinámicamente si es necesario
                upsert: true
              });

            if (uploadError) {
              console.error(`Error subiendo imagen para ${nombre}:`, uploadError.message);
            } else {
              // Obtener URL pública estable
              const { data: publicUrlData } = supabase.storage
                .from("dishes")
                .getPublicUrl(fileName);
              
              publicImageUrl = publicUrlData.publicUrl;
            }
          }
        }
      }

      // 5. Preparar objeto para Supabase
      dishesToUpsert.push({
        id: pageId, // Usamos el ID de Notion como PK para garantizar idempotencia
        name: nombre,
        description: descripcion,
        category: categoria,
        image_url: publicImageUrl,
        is_available: isAvailable,
        price_cents: 0, // Placeholder
        calories: calorias,
        featured: destacado,
        difficulty: dificultad,
        chef_name: chefName,
        chef_bio: chefBio,
        ingredients: ingredientes,
        story: historia,
        spice_level: nivelPicante,
        servings: raciones,
        prep_time: tiempoPrep,
        tags: finalTags,
        updated_at: new Date().toISOString(),
      });
    }

    // 6. Upsert Masivo a Supabase
    if (dishesToUpsert.length > 0) {
      const { error } = await supabase
        .from("dishes")
        .upsert(dishesToUpsert, { onConflict: "id" });

      if (error) throw error;
      console.log(`✅ Sincronizados ${dishesToUpsert.length} platos exitosamente.`);
    } else {
      console.log("No se encontraron platos para sincronizar.");
    }

  } catch (error) {
    console.error("❌ Error fatal en la sincronización:", error);
    process.exit(1);
  }
}

syncDishes();