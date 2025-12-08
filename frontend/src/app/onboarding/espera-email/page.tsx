// src/app/onboarding/espera-email/page.tsx
'use client';

import { useState } from 'react';
import { useSupabase } from "@/lib/supabase/client";


export default function EsperaEmailPage() {
  const supabase = useSupabase(); // ✅ instancia única estable
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleResend = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Obtener usuario actual
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email;

      if (!email) {
        setMessage('No se encontró un email asociado a tu sesión.');
        return;
      }

      // Reenviar email de confirmación
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;

      setMessage('Correo de confirmación reenviado. Revisá tu bandeja de entrada.');
    } catch (err: unknown) {
      const msg =
        err instanceof Error && typeof err.message === 'string'
          ? err.message
          : 'Ocurrió un error al reenviar el correo.';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-blue-50">
      <div className="mx-4 max-w-md text-center">
        <h1 className="mb-4 text-3xl font-bold text-blue-700">Revisá tu bandeja de entrada</h1>

        <p className="mb-6 text-gray-700">
          Te enviamos un correo de confirmación. Hacé clic en el enlace para activar tu cuenta y
          continuar con el onboarding.
        </p>

        <p className="mb-6 text-sm text-gray-500">
          Si no lo encontrás, revisá la carpeta de <strong>Spam</strong> o <strong>Promociones</strong>.
        </p>

        <button
          onClick={handleResend}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Reenviando...' : 'Reenviar correo de confirmación'}
        </button>

        {message && (
          <div className="mt-4 rounded bg-blue-100 px-3 py-2 text-sm text-blue-700">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
