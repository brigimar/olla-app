"use client";
import { useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabase/client";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

// Helper para mapear 'whatsapp' a 'sms'
const toSupabaseMobileType = (_otpChannel: "sms" | "whatsapp"): "sms" => {
  return "sms";
};

export const useAuth = () => {
  const supabase = useSupabase(); // ✅ instancia única estable
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
      if (error) console.error("Error fetching session:", error);
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase]);

  // ... resto de funciones signUp, signIn, verifyOtp, etc.
};
