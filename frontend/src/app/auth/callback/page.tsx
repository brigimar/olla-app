'use client';

import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabase } from "@/lib/supabase/client";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { client: supabase, isLoading, error: supabaseError } = useSupabase(); // ✅ Cambiado aquí
  
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading || !supabase) return;

    if (supabaseError) {
      console.error("Error en Supabase:", supabaseError);
      router.replace('/onboarding/error?reason=supabase_init_failed');
      return;
    }

    const run = async () => {
      if (!code) {
        router.replace('/onboarding/error?reason=missing_code');
        return;
      }

      try {
        setLoading(true);
        
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
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      // Cleanup
    };
  }, [code, next, router, supabase, isLoading, supabaseError, mounted]);

  // Mostrar loading mientras se inicializa Supabase
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="mx-4 max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-green-600"></div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-800">Inicializando...</h1>
          <p className="text-gray-600">Cargando configuración de autenticación...</p>
        </div>
      </div>
    );
  }

  // Mostrar error si hay problema con Supabase
  if (supabaseError || !supabase) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-red-50">
        <div className="mx-4 max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-3xl text-red-600">⚠️</span>
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-red-800">Error de configuración</h1>
          <p className="text-red-600 mb-4">
            No se pudo inicializar el servicio de autenticación.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-red-600 px-4 py-2 text-white"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Pantalla normal de loading
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="mx-4 max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-green-600"></div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800">
          {loading ? 'Confirmando tu cuenta...' : 'Cargando...'}
        </h1>
        <p className="text-gray-600">
          {loading 
            ? 'Estamos verificando tu identidad y creando tu sesión. En unos segundos vas a avanzar al siguiente paso del registro...'
            : 'Preparando la verificación...'}
        </p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="mx-4 max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-green-600"></div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-800">Cargando...</h1>
          <p className="text-gray-600">Preparando la página de verificación...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
