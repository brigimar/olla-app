// hooks/useProducer.ts
import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProducerServerSchema } from '@/shared/validation';
import { z } from 'zod';

type ProducerFormData = z.infer<typeof ProducerServerSchema>;

export const useProducer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const createOrUpdateProducer = async (data: ProducerFormData, logoFile?: File | null) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('No autenticado');

      let logoUrl = data.logo_url ?? null;

      if (logoFile) {
        const timestamp = Date.now();
        const fileName = `logo-${timestamp}.webp`;
        const path = `cocineros/${user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('cocineros')
          .upload(path, logoFile, {
            upsert: true,
            contentType: 'image/webp',
          });
        if (uploadError) throw new Error('Error al subir logo');
        const { data: urlData } = supabase.storage.from('cocineros').getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }

      const payload = {
        id: user.id,
        business_name: data.business_name,
        description: data.description,
        address: data.address,
        email: data.email,
        phone: data.phone,
        logo_url: logoUrl,
        visible: data.visible ?? false,
        is_active: data.is_active ?? false,
      };

      const { error: upsertError } = await supabase
        .from('producers')
        .upsert(payload, { onConflict: 'id' });

      if (upsertError) throw new Error('Error al guardar negocio');
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getProducer = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('producers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw new Error('Error al obtener negocio');
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createOrUpdateProducer,
    getProducer,
  };
};
