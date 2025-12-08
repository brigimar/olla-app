import { supabase } from '@/lib/supabase/client';

export async function requireAuth() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  const user = data?.session?.user;
  if (!user) throw new Error('Unauthorized');
  return user;
}
