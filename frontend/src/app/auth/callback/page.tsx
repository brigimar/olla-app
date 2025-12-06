// app/auth/callback/page.tsx
'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Memoize client to avoid effect re-runs caused by a new instance each render
  const supabase = useMemo(() => createClient(), []);

  // Read once to keep effect dependencies minimal and stable
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/onboarding/negocio';

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      // Early exit: missing code (e.g., direct visit)
      if (!code) {
        router.replace('/onboarding/crear-cuenta?error=missing_code');
        return;
      }

      // If already authenticated, skip exchange and proceed
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        try {
          if (mounted) {
            localStorage.setItem('onboardingStage', 'crear-cuenta-completada');
            router.replace(next);
          }
          return;
        } catch {
          // ignore SSR/localStorage edge cases
        }
      }

      // Exchange code for session
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        if (!mounted) return;

        try {
          localStorage.setItem('onboardingStage', 'crear-cuenta-completada');
        } catch {
          // ignore if localStorage not available
        }

        router.replace(next);
      } catch (err: any) {
        if (!mounted) return;
        const message =
          typeof err?.message === 'string' ? err.message : 'auth_failed';
        router.replace(
          `/onboarding/crear-cuenta?error=${encodeURIComponent(message)}`
        );
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [code, next, router, supabase]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-4">
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Confirmando tu cuenta
        </h1>
        <p className="text-gray-600">
          Por favor, esperá mientras verificamos tu identidad y te llevamos a la
          siguiente etapa de registro...
        </p>
      </div>
    </div>
  );
}
