// src/app/onboarding/espera-email/page.tsx
"use client";

import { useState } from 'react';
import { useSupabase } from "@/lib/supabase/client";

export default function EsperaEmailPage() {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleResend = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Obtener usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;

      const email = user?.email;

      if (!email) {
        setMessage('No se encontró un email asociado a tu sesión.');
        return;
      }

      // Reenviar email de confirmación
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      if (!siteUrl) {
        throw new Error("NEXT_PUBLIC_SITE_URL no está definido en las variables de entorno.");
      }

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (resendError) throw resendError;

      setMessage('Correo de confirmación reenviado. Revisá tu bandeja de entrada.');
    } catch (err: unknown) {
      const msg =
        err instanceof Error && typeof err.message === 'string'
          ? err.message
          : 'Ocurrió un error al reenviar el correo.';
      setMessage(msg);
      console.error('Error al reenviar correo:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-blue-50">
      <div className="mx-4 max-w-md rounded-lg bg-white p-8 text-center shadow-md">
        <h1 className="mb-4 text-3xl font-bold text-blue-700">Revisá tu bandeja de entrada</h1>

        <div className="mb-6 rounded-md bg-blue-50 p-4">
          <svg className="mx-auto mb-4 h-12 w-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
          
          <p className="mb-4 text-gray-700">
            Te enviamos un correo de confirmación. Hacé clic en el enlace para activar tu cuenta y continuar con el onboarding.
          </p>

          <p className="text-sm text-gray-600">
            Si no lo encontrás, revisá la carpeta de <strong className="font-semibold">Spam</strong> o <strong className="font-semibold">Promociones</strong>.
          </p>
        </div>

        <button
          onClick={handleResend}
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Reenviando...
            </span>
          ) : (
            'Reenviar correo de confirmación'
          )}
        </button>

        {message && (
          <div className={`mt-4 rounded-md p-3 text-sm ${message.includes('reenviado') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}