// src/services/auth.ts
import { supabase, createClient } from '@/lib/supabase/client';

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};
