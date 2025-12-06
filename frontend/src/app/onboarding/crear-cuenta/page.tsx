// app/onboarding/crear-cuenta/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SignUpChoiceSchema } from '@/shared/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

type FormData = z.infer<typeof SignUpChoiceSchema>;

export default function CrearCuentaPage() {
  const router = useRouter();
  const supabase = createClient();

  const [otpSent, setOtpSent] = useState(false);
  const [phoneForOtp, setPhoneForOtp] = useState('');
  const [otpChannel, setOtpChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(SignUpChoiceSchema),
    defaultValues: { method: 'email' },
  });

  const method = watch('method');

  const mapAuthError = (message?: string) => {
    if (!message) return 'Ocurrió un error. Intenta nuevamente.';
    const msg = message.toLowerCase();

    if (msg.includes('already registered') || msg.includes('user already exists')) {
      return 'Este usuario ya está registrado. Probá iniciar sesión.';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'Demasiados intentos. Esperá un momento antes de reintentar.';
    }
    if (msg.includes('invalid phone')) {
      return 'El teléfono no es válido. Usá formato internacional, por ejemplo +5491123456789.';
    }
    if (msg.includes('invalid email')) {
      return 'El email no es válido. Revisá el formato.';
    }
    return message;
  };

  const onSubmit = async (data: FormData) => {
    setError('');
    setLoading(true);
    try {
      if (data.method === 'email') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: data.email!,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              method: 'email',
              business_name: data.business_name,
            },
          },
        });

        if (signUpError) throw signUpError;

        router.push('/onboarding/espera-email');
      } else {
        // Elegí el canal dinámicamente según tu configuración o preferencia del usuario
        const channel: 'sms' | 'whatsapp' = 'whatsapp'; // cambiá a 'sms' si preferís SMS
        setOtpChannel(channel);

        const { error: signUpError } = await supabase.auth.signUp({
          phone: data.phone!,
          password: data.password,
          options: {
            channel,
            data: {
              method: 'phone',
              business_name: data.business_name,
            },
          },
        });

        if (signUpError) throw signUpError;

        setPhoneForOtp(data.phone!);
        setOtpSent(true);
      }
    } catch (err: any) {
      setError(mapAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: phoneForOtp,
        token: otp,
        type: otpChannel, // usa el mismo canal elegido en el signUp
      });

      if (verifyError) throw verifyError;

      localStorage.setItem('onboardingStage', 'crear-cuenta-completada');
      router.push('/onboarding/negocio');
    } catch (err: any) {
      setError('Código incorrecto o expirado. Solicitá uno nuevo y volvé a intentar.');
    } finally {
      setLoading(false);
    }
  };

  if (otpSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">Confirma tu teléfono</h1>
          <p className="text-center text-gray-600 mb-6">
            Ingresá el código de 6 dígitos que enviamos a{' '}
            <span className="font-medium">{phoneForOtp}</span> vía {otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'}.
          </p>

          <div className="mb-6">
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="______"
              className="w-full text-3xl font-mono text-center border-2 border-gray-300 rounded-lg p-4 focus:outline-none focus:border-green-500"
              maxLength={6}
              autoFocus
              aria-label="Código de verificación"
            />
          </div>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <div className="space-y-3">
            <button
              onClick={verifyOtp}
              disabled={loading || otp.length < 6}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Confirmar código'}
            </button>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setOtpChannel(otpChannel === 'whatsapp' ? 'sms' : 'whatsapp')}
                className="text-gray-600 hover:text-gray-800 transition text-sm"
              >
                Cambiar a {otpChannel === 'whatsapp' ? 'SMS' : 'WhatsApp'}
              </button>
              <button
                onClick={() => setOtpSent(false)}
                className="text-gray-600 hover:text-gray-800 transition text-sm"
              >
                Usar otro número o método
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            ¿No recibiste el código? Revisá tu spam o solicitá uno nuevo después de 60 segundos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Crear tu cuenta</h1>
        <p className="text-center text-gray-600 mb-8">
          Elegí cómo querés confirmar tu identidad. Es rápido y seguro.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="block font-medium text-gray-700">Método de confirmación</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="email"
                  {...register('method')}
                  className="form-radio h-4 w-4 text-green-600"
                />
                <span className="text-gray-700">Email</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="phone"
                  {...register('method')}
                  className="form-radio h-4 w-4 text-green-600"
                />
                <span className="text-gray-700">Teléfono (WhatsApp/SMS)</span>
              </label>
            </div>
            <p className="text-sm text-gray-500">
              Vas a recibir un código para verificar tu identidad.
            </p>
          </div>

          {method === 'email' && (
            <div className="space-y-2">
              <label htmlFor="email" className="block font-medium text-gray-700">Email</label>
              <input
                id="email"
                placeholder="tu@ejemplo.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>
          )}

          {method === 'phone' && (
            <div className="space-y-2">
              <label htmlFor="phone" className="block font-medium text-gray-700">Teléfono</label>
              <input
                id="phone"
                placeholder="Ej: +5491123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                aria-invalid={!!errors.phone}
                {...register('phone')}
              />
              <p className="text-sm text-gray-500">
                Formato internacional: código de país + número (ej: +54 para Argentina).
              </p>
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="block font-medium text-gray-700">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            <p className="text-sm text-gray-500">
              Usá una contraseña segura con letras, números y símbolos.
            </p>
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="business_name" className="block font-medium text-gray-700">Nombre de tu negocio</label>
            <input
              id="business_name"
              placeholder="Ej: Pastas de la Abuela"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              aria-invalid={!!errors.business_name}
              {...register('business_name')}
            />
            {errors.business_name && <p className="text-red-500 text-sm">{errors.business_name.message}</p>}
          </div>

          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Continuar a mi negocio'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6 text-sm">
          ¿Ya tenés cuenta? <a href="/login" className="text-green-600 hover:underline">Iniciá sesión</a>
        </p>
      </div>
    </div>
  );
}
