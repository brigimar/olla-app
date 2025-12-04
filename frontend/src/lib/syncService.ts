// src/lib/syncService.ts
import { supabase } from '@/lib/supabase';

export async function syncData() {
  try {
    const { data, error } = await supabase.from('dishes').select('*');

    if (error) throw error;

    // procesar data
    console.log('Sync OK:', data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error en syncData:', error.message);
    } else {
      console.error('Error en syncData: error desconocido', error);
    }
  }
}
