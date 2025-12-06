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
      // Insertar perfil del productor
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
        },
      ]);

      if (insertError) throw insertError;

      let logoUrl: string | undefined;

      // Si hay logo, validar y subir
      if (logo) {
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(logo.type)) {
          throw new Error('Formato de imagen no permitido');
        }

        if (logo.size > 2 * 1024 * 1024) {
          // 2MB
          throw new Error('El archivo excede los 2MB');
        }

        const filePath = `${userId}/logo.png`;

        const { error: uploadError } = await supabase.storage
          .from('producer-logos')
          .upload(filePath, logo, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data } = supabase.storage.from('producer-logos').getPublicUrl(filePath);

        logoUrl = data.publicUrl;
      }

      return { logoUrl };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido al crear perfil';
      setError(message);
      return { logoUrl: undefined };
    } finally {
      setLoading(false);
    }
  };

  return { createProfile, loading, error };
}
