'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const processSignIn = async () => {
      const code = searchParams.get('code');

      // 1. Si viene con código (OAuth o Magic Link)
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('Error intercambiando código:', error);
          router.replace('/login?error=auth');
          return;
        }

        router.replace('/bienvenida');
        return;
      }

      // 2. Si no hay código, intentar obtener sesión
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error obteniendo sesión:', error);
        router.replace('/login?error=auth');
        return;
      }

      if (data.session) {
        router.replace('/bienvenida');
      } else {
        router.replace('/login');
      }
    };

    processSignIn();
  }, [router, searchParams]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-lg">Verificando tu cuenta...</p>
    </div>
  );
}
