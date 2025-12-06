'use client';
//frontend\src\app\auth\callback\page.tsx
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; // revisar nombre correcto

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const processSignIn = async () => {
      // Supabase envía un "code" para intercambio OAuth y magic links
      const code = searchParams.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Error intercambiando código:', error);
          router.replace('/login?error=auth');
          return;
        }

        // Si todo salió bien → ir a bienvenida
        router.replace('/bienvenida');
        return;
      }

      // Si no hay código → intentar leer la sesión
      const { data } = await supabase.auth.getSession();

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
