// frontend/src/services/auth.ts
import { supabase } from '@/lib/supabase';

export async function signUpCocinero(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/bienvenida`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
