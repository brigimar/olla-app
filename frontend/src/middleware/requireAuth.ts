// src/lib/auth/requireAuth.ts
import { getServerSupabase } from "@/lib/supabase/server";
import { type ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { type User } from "@supabase/supabase-js";

export async function requireAuth(cookies: ReadonlyRequestCookies) {
  const supabase = getServerSupabase(cookies);
  const {  { session }, error } = await supabase.auth.getSession();

  if (error || !session?.user) {
    throw new Error("Unauthorized");
  }

  return session.user as User;
}