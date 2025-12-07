// hooks/useProducts.ts
import { useState } from 'react';
import { supabase, createClient } from '@/lib/supabase/client';
import { DishServerSchema } from '@/shared/validation';
import { z } from 'zod';

type DishFormData = z.infer<typeof DishServerSchema>;

export const useProducts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDish = async (dishData: DishFormData, photoFiles?: File[]) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('No autenticado');

      const { data: dish, error: dishError } = await supabase
        .from('dishes')
        .insert({
          producer_id: user.id,
          name: dishData.name,
          category: dishData.category,
          ingredients: dishData.ingredients || [],
          price_cents: dishData.price_cents,
          portion_size: dishData.portion_size,
          is_available: true,
          status: 'active',
        })
        .select('id')
        .single();

      if (dishError) throw new Error('Error al crear plato');
      if (!dish?.id) throw new Error('No se pudo obtener ID del plato');

      let photoUrls: string[] = [];

      if (photoFiles && photoFiles.length > 0) {
        const uploadPromises = photoFiles.map(async (file, index) => {
          const ext = file.name.split('.').pop() || 'jpg';
          const path = `platos/${user.id}/${dish.id}/${Date.now()}-${index}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('platos')
            .upload(path, file, { upsert: true, contentType: file.type });
          if (uploadError) throw new Error('Error al subir foto');
          const { data: urlData } = supabase.storage.from('platos').getPublicUrl(path);
          return urlData.publicUrl;
        });

        photoUrls = await Promise.all(uploadPromises);

        const { error: updateError } = await supabase
          .from('dishes')
          .update({ photo_urls: photoUrls })
          .eq('id', dish.id);

        if (updateError) throw new Error('Error al actualizar fotos');
      }

      return { success: true, dishId: dish.id, photoUrls };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getDishes = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('producer_id', user.id);

      if (error) throw new Error('Error al obtener platos');
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createDish,
    getDishes,
  };
};
