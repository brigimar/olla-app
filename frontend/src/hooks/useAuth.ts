import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Helper para mapear 'whatsapp' a 'sms'
const toSupabaseMobileType = (_otpChannel: 'sms' | 'whatsapp'): 'sms' => {
  return 'sms';
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) console.error('Error fetching session:', error);
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
  }, []);

  const signUp = async (
    method: 'email' | 'phone',
    identifier: string,
    password: string,
    metadata?: Record<string, unknown>,
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
          channel: channel === 'whatsapp' ? 'sms' : channel,
          data: metadata,
        },
      });
      if (error) throw error;
      return data;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const verifyOtp = async (
    phone: string,
    token: string,
    otpChannel: 'sms' | 'whatsapp' = 'sms'
  ) => {
    const type = toSupabaseMobileType(otpChannel);
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type });
    if (error) throw error;
    return data;
  };

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
