'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signUpSchema, SignUpFormData } from '@/lib/validations/signUp';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useSupabase } from "@/lib/supabase/client";


type FormData = SignUpFormData;

export default function CrearCuentaPage() {
  const router = useRouter();
  const supabase = useSupabase(); // ✔ AHORA FUNCIONAen este proyecto
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.replace('/dashboard');
      } else {
        setSessionChecked(true);
      }
    };

    checkSession();
  }, [router, supabase]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(signUpSchema),
  });

  const mapAuthError = (message?: string) => {
    if (!message) return 'Ocurrió un error. Intentá nuevamente.';
    const msg = message.toLowerCase();

    if (msg.includes('already registered') || msg.includes('user already exists'))
      return 'Este usuario ya está registrado. Probá iniciar sesión.';

    if (msg.includes('rate limit') || msg.includes('too many requests'))
      return 'Demasiados intentos. Esperá un momento antes de reintentar.';

    if (msg.includes('invalid email')) return 'El email no es válido. Revisá el formato.';

    return message;
  };

  const onSubmit = async (formValues: FormData) => {
    setError('');
    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error: signUpError } = await supabase.auth.signUp({
        email: formValues.email,
        password: formValues.password,
        options: {
          emailRedirectTo: redirectTo,
          data: { name: formValues.name },
        },
      });

      if (signUpError) throw signUpError;

      router.push('/onboarding/espera-email');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Ocurrió un error. Intentá nuevamente.';
      setError(mapAuthError(message));
    } finally {
      setLoading(false);
    }
  };

  if (!sessionChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Verificando sesión...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded bg-white p-6 shadow">
      <h1 className="mb-4 text-xl font-bold">Crear cuenta</h1>

      {error && (
        <div className="mb-3 rounded bg-red-100 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Nombre</label>
          <input {...register('name')} className="w-full rounded border p-2" placeholder="Tu nombre" />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input {...register('email')} type="email" className="w-full rounded border p-2" placeholder="tu@email.com" />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Contraseña</label>
          <input {...register('password')} type="password" className="w-full rounded border p-2" placeholder="mínimo 6 caracteres" />
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Verificar contraseña</label>
          <input {...register('confirmPassword')} type="password" className="w-full rounded border p-2" />
          {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="w-full rounded bg-green-600 py-2 text-white disabled:opacity-50">
          {loading ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>
    </div>
  );
}
