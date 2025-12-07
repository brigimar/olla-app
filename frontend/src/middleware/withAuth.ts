// src/middleware/requireAuth.ts
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export const requireAuth = async (req: NextRequest) => {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error('Unauthorized');

  return user;
};
