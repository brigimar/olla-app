// frontend/src/app/onboarding/crear-cuenta/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { signUpSchema, SignUpFormData } from "@/lib/validations/signUp";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

type FormData = SignUpFormData;

export default function CrearCuentaPage() {
  const router = useRouter();
  const supabaseClient = createClient();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(signUpSchema),
  });

  const mapAuthError = (message?: string) => {
    if (!message) return 'Ocurrió un error. Intenta nuevamente.';
    const msg = message.toLowerCase();
    if (msg.includes('already registered') || msg.includes('user already exists'))
      return 'Este usuario ya está registrado. Probá iniciar sesión.';
    if (msg.includes('rate limit') || msg.includes('too many requests'))
      return 'Demasiados intentos. Esperá un momento antes de reintentar.';
    if (msg.includes('invalid email')) return 'El email no es válido. Revisá el formato.';
    return message;
  };

  const onSubmit = async (data: FormData) => {
    setError('');
    setLoading(true);
    try {
      const { error: signUpError } = await supabaseClient.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: data.name, // opcional: guarda como user_metadata
          },
        },
      });

      if (signUpError) throw signUpError;

      // Página de espera (opcional) o redirección directa al callback una vez que el usuario hace clic en el email.
      router.push('/onboarding/espera-email');
    } catch (err: any) {
      setError(mapAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-xl font-bold mb-4">Crear cuenta</h1>

      {error && (
        <div className="mb-3 rounded bg-red-100 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Nombre</label>
          <input
            {...register('name')}
            className="w-full border p-2 rounded"
            placeholder="Tu nombre"
          />
          {errors.name && <p className="text-red-600 text-sm">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            {...register('email')}
            type="email"
            className="w-full border p-2 rounded"
            placeholder="tu@email.com"
          />
          {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Contraseña</label>
          <input
            {...register('password')}
            type="password"
            className="w-full border p-2 rounded"
            placeholder="mínimo 6 caracteres"
          />
          {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Verificar contraseña</label>
          <input
            {...register('confirmPassword')}
            type="password"
            className="w-full border p-2 rounded"
          />
          {errors.confirmPassword && (
            <p className="text-red-600 text-sm">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>
    </div>
  );
}
