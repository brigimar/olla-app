'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabase } from "@/lib/supabase/client";


function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase(); // ✅ instancia única estable

  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!code) {
        router.replace('/onboarding/error?reason=missing_code');
        return;
      }

      try {
        // Verificar si ya hay sesión activa
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          if (mounted) {
            localStorage.setItem('onboardingStage', 'crear-cuenta-completada');
            router.replace(next);
          }
          return;
        }

        // Intercambiar el código por sesión
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        if (mounted) {
          localStorage.setItem('onboardingStage', 'crear-cuenta-completada');
          router.replace(next);
        }
      } catch (err: unknown) {
        if (!mounted) return;
        const message =
          err instanceof Error && typeof err.message === 'string'
            ? err.message
            : 'auth_failed';

        console.error('Error en callback:', message);
        router.replace(`/onboarding/error?reason=${encodeURIComponent(message)}`);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [code, next, router, supabase]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="mx-4 max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-green-600"></div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800">Confirmando tu cuenta</h1>
        <p className="text-gray-600">
          Estamos verificando tu identidad y creando tu sesión. En unos segundos vas a avanzar al
          siguiente paso del registro...
        </p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<p>Cargando...</p>}>
      <CallbackContent />
    </Suspense>
  );
}
