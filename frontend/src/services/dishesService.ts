// src/services/dishesService.ts
import { supabase } from '@/lib/supabase/client';

export const getDishesByProducer = async (producerId: string) => {
  const { data, error } = await supabase.from('dishes').select('*').eq('producer_id', producerId);

  if (error) throw error;
  return data;
};
