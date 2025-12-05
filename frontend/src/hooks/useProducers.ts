'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useProducers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProfile = async (userId: string, profile: {
    business_name: string;
    email: string;
    phone: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from('producers').insert([{
        id: userId, // ← usamos directamente el user.id del signUp
        business_name: profile.business_name,
        email: profile.email,
        phone: profile.phone,
        is_active: false,
        visible: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);

      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { createProfile, loading, error };
}
