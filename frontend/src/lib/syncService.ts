import { SupabaseClient } from '@supabase/supabase-js';

  try {

      method: 'POST',
    });

    // 2. Procesar y transformar los datos
      return {
        id_plato: page.id,
        nombre: page.properties.Nombre?.title?.[0]?.plain_text || '',
        precio: page.properties.Precio?.number || 0,
        // ⚡ Agregá aquí el resto de campos que quieras mapear
      };
    });

    // 3. Ejecutar Upsert en Supabase
    const { error } = await supabase.from('dishes').upsert(dishesToUpsert);

    if (error) {
      throw new Error(`Error al insertar en Supabase: ${error.message}`);
    }

  } catch (error: any) {
    console.error('❌ Fallo en el servicio de sincronización:', error.message);
    throw error;
  }
}
