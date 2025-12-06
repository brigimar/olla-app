// hooks/useAuth.ts
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoizamos el cliente para evitar recrearlo en cada render
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error('Error fetching session:', error);
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase]);

  // -----------------------------
  // Métodos de autenticación
  // -----------------------------

  // SignUp por email o teléfono
  const signUp = async (
    method: 'email' | 'phone',
    identifier: string,
    password: string,
    metadata?: any,
    channel: 'sms' | 'whatsapp' = 'sms'
  ) => {
    if (method === 'email') {
      const { data, error } = await supabase.auth.signUp({
        email: identifier,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.auth.signUp({
        phone: identifier,
        password,
        options: {
          channel,
          data: metadata,
        },
      });
      if (error) throw error;
      return data;
    }
  };

  // Login con email + contraseña
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  // Login con OTP (SMS/WhatsApp)
  const verifyOtp = async (phone: string, token: string, type: 'sms' | 'whatsapp' = 'sms') => {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type });
    if (error) throw error;
    return data;
  };

  // Login con magic link (email)
  const signInWithMagicLink = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  };

  // Cerrar sesión
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    verifyOtp,
    signInWithMagicLink,
    signOut,
  };
};
