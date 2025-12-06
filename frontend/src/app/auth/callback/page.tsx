// frontend/src/app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      // 1. Obtener usuario autenticado
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Error obteniendo usuario:', error.message);
        return;
      }

      if (user) {
        // 2. Redirigir automáticamente a /bienvenida
        router.replace('/bienvenida');
      } else {
        // Si no hay usuario, redirigir al login
        router.replace('/login');
      }
    };

    handleRedirect();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-lg">Verificando tu cuenta...</p>
    </div>
  );
}
