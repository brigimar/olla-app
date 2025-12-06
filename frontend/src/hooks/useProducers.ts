'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useProducers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProfile = async (
    userId: string,
    profile: {
      business_name: string;
      description?: string;
      address?: string;
      email: string;
      phone: string;
    },
    logo?: File
  ): Promise<{ logoUrl?: string }> => {
    setLoading(true);
    setError(null);
    try {
      // Insertar perfil en la tabla producers
      const { error: insertError } = await supabase.from('producers').insert([
        {
          id: userId,
          business_name: profile.business_name,
          description: profile.description,
          address: profile.address,
          email: profile.email,
          phone: profile.phone,
          is_active: false,
          visible: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      if (insertError) throw insertError;

      let logoUrl: string | undefined;

      // Subir logo si existe
      if (logo) {
        const { error: uploadError } = await supabase.storage
          .from('producer-logos') // 👈 nombre del bucket en Supabase
          .upload(`${userId}/logo.png`, logo, {
            cacheControl: '3600',
            upsert: true,
          });
        if (uploadError) throw uploadError;

        // Obtener URL pública del logo
        const { data } = supabase.storage.from('producer-logos').getPublicUrl(`${userId}/logo.png`);
        logoUrl = data.publicUrl;
      }

      return { logoUrl };
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido al crear perfil');
      return {};
    } finally {
      setLoading(false);
    }
  };

  return { createProfile, loading, error };
}
