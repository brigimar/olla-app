'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SignUp ajustado
  const signUp = async (
    email: string,
    password: string
  ): Promise<{ user: User | null; session: Session | null; error: AuthError | null }> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/bienvenida`,
          data: { type: 'signup' }, // metadata opcional
        },
      });

      if (error) {
        setError(error.message);
        return { user: null, session: null, error };
      }

      return { user: data.user, session: data.session, error: null };
    } finally {
      setLoading(false);
    }
  };

  // SignIn ajustado
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ user: User | null; session: Session | null; error: AuthError | null }> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return { user: null, session: null, error };
      }

      return { user: data.user, session: data.session, error: null };
    } finally {
      setLoading(false);
    }
  };

  return {
    signUp,
    signIn,
    loading,
    error,
  };
}
