// frontend/src/services/auth.ts
import { supabase } from '@/lib/supabase';

export async function signUpCocinero(email: string, password: string) {
  if (!email || !email.includes('@')) {
    throw new Error('Email inválido');
  }

  if (!password || password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // SIEMPRE se debe enviar al callback
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error('Supabase signup error:', error);
    throw new Error('No se pudo crear la cuenta');
  }

  return data;
}
