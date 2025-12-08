'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Dish } from '@/types/database.types';

export const usePopularDishes = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        console.log('[usePopularDishes] Iniciando fetch…');
        setLoading(true);

        console.log(
          '[usePopularDishes] Query: platos disponibles, ordenados por destacado y nombre, limit 10'
        );

        const { data, error } = await supabase
          .from('dishes')
          .select('*')
          .eq('is_available', true)
          .order('destacado', { ascending: false })
          .order('name', { ascending: true })
          .limit(10);

        console.log('[usePopularDishes] Respuesta Supabase:', { data, error });

        if (error) {
          console.error('[usePopularDishes] Error Supabase:', error);
          throw error;
        }

        setDishes(data as Dish[]);
      } catch (err: unknown) {
        console.error('[usePopularDishes] Excepción capturada:', err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error desconocido al cargar platos');
        }
      } finally {
        console.log('[usePopularDishes] Finalizando fetch. Loading=false');
        setLoading(false);
      }
    };

    fetchDishes();
  }, []);

  return { dishes, loading, error };
};
