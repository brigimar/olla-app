// src/lib/auth/requireAuth.ts
import { getServerSupabase } from "@/lib/supabase/server";
import { type User } from "@supabase/supabase-js";

export async function requireAuth() {
  const supabase = getServerSupabase();
  const {  { session }, error } = await supabase.auth.getSession();

  if (error || !session?.user) {
    throw new Error("Unauthorized");
  }

  return session.user as User;
}