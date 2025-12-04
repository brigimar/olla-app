import { supabase } from '@/lib/supabase';

export const dishesService = {
  async getAll() {
    const { data, error } = await supabase.from('dishes').select('*');
    if (error) throw error;
    return data ?? [];
  },

  async getDishesByCity(city: string) {
    const { data, error } = await supabase.from('dishes').select('*').eq('city', city); // ✅ usamos city
    if (error) throw error;
    return data ?? [];
  },

  async getPopularDishes(limit: number) {
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .order('popularity', { ascending: false }) // ⚡ suponiendo que tenés un campo popularity
      .limit(limit); // ✅ usamos limit
    if (error) throw error;
    return data ?? [];
  },

  async getDishById(id: string) {
    const { data, error } = await supabase.from('dishes').select('*').eq('id', id).single(); // ✅ usamos id
    if (error) throw error;
    return data ?? null;
  },
};
