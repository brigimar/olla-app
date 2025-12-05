'use client';
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Mantener estado de sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  // Crear usuario (signUp)
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        return { user: null, error };
      }
      setUser(data.user);
      return { user: data.user, error: null };
    } finally {
      setLoading(false);
    }
  };

  // Iniciar sesión
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        throw error;
      }
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
      throw error;
    }
    setUser(null);
  };

  return { user, error, loading, signUp, signIn, signOut };
}
