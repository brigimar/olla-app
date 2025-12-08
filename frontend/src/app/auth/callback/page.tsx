'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client'; // ✅ instancia única

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/onboarding/negocio';

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!code) {
        router.replace('/onboarding/crear-cuenta?error=missing_code');
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        if (mounted) {
          localStorage.setItem('onboardingStage', 'crear-cuenta-completada');
          router.replace(next);
        }
        return;
      }

      try {
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
        router.replace(`/onboarding/crear-cuenta?error=${encodeURIComponent(message)}`);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [code, next, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="mx-4 max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-green-600"></div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800">Confirmando tu cuenta</h1>
        <p className="text-gray-600">
          Por favor, esperá mientras verificamos tu identidad y te llevamos a la siguiente etapa de
          registro...
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
