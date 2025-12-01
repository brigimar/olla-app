// services/dishesService.ts
import { supabase } from '@/lib/supabase';
import { Dish, DishInsert, DishUpdate } from '@/lib/supabase.types';

// ─── FILTROS PARA BÚSQUEDA ────────────────────────────────────────────────────

export interface SearchFilters {
  city?: string;
  minPrice?: number;   // en céntimos
  maxPrice?: number;   // en céntimos
  status?: 'active' | 'inactive';
}

// ─── SERVICIO COMPLETO ────────────────────────────────────────────────────────

export const dishesService = {
  /**
   * Obtiene los platos más populares (activo + mayor rating)
   */
  async getPopularDishes(limit: number = 8, city?: string): Promise<Dish[]> {
    let query = supabase
      .from('dishes')
      .select('*')
      .eq('status', 'active')
      .order('rating', { ascending: false })
      .limit(limit);

    if (city) {
      query = query.eq('city', city);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error in getPopularDishes:', error);
      throw new Error(`Error al obtener platos populares: ${error.message}`);
    }

    return data;
  },

  /**
   * Obtiene platos por ciudad (solo activos, ordenados por fecha reciente)
   */
  async getDishesByCity(city: string): Promise<Dish[]> {
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('city', city)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Supabase error in getDishesByCity (city: ${city}):`, error);
      throw new Error(`Error al obtener platos en ${city}: ${error.message}`);
    }

    return data;
  },

  /**
   * Obtiene un plato por ID
   */
  async getDishById(id: string): Promise<Dish | null> {
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error(`Supabase error in getDishById (id: ${id}):`, error);
      throw new Error(`Error al obtener el plato: ${error.message}`);
    }

    return data;
  },

  /**
   * Búsqueda avanzada de platos por nombre o descripción + filtros
   */
  async searchDishes(query: string, filters: SearchFilters = {}): Promise<Dish[]> {
    if (!query.trim()) {
      throw new Error('La búsqueda no puede estar vacía');
    }

    let q = supabase
      .from('dishes')
      .select('*')
      .ilike('name', `%${query}%`)
      .or(`description.ilike.%${query}%`);

    // Filtros opcionales
    if (filters.city) {
      q = q.eq('city', filters.city);
    }
    if (filters.status) {
      q = q.eq('status', filters.status);
    } else {
      // Por defecto, solo activos en búsqueda
      q = q.eq('status', 'active');
    }
    if (filters.minPrice !== undefined) {
      q = q.gte('price_cents', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      q = q.lte('price_cents', filters.maxPrice);
    }

    const { data, error } = await q;

    if (error) {
      console.error('Supabase error in searchDishes:', error);
      throw new Error(`Error en la búsqueda de platos: ${error.message}`);
    }

    return data;
  },

  /**
   * Crea un nuevo plato (para admins o cocineros verificados)
   */
  async createDish(dish: DishInsert): Promise<Dish> {
    const { data, error } = await supabase
      .from('dishes')
      .insert(dish)
      .select()
      .single();

    if (error) {
      console.error('Supabase error in createDish:', error);
      throw new Error(`Error al crear el plato: ${error.message}`);
    }

    return data;
  },

  /**
   * Actualiza un plato existente
   */
  async updateDish(id: string, updates: DishUpdate): Promise<Dish> {
    const { data, error } = await supabase
      .from('dishes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Supabase error in updateDish (id: ${id}):`, error);
      throw new Error(`Error al actualizar el plato: ${error.message}`);
    }

    return data;
  },

  /**
   * Elimina un plato (soft delete recomendado; aquí hard delete)
   * En producción, considera usar un campo `deleted_at` en lugar de borrar
   */
  async deleteDish(id: string): Promise<void> {
    const { error } = await supabase
      .from('dishes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Supabase error in deleteDish (id: ${id}):`, error);
      throw new Error(`Error al eliminar el plato: ${error.message}`);
    }
  },
};