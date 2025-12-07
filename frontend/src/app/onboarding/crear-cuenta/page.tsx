// src/app/onboarding/crear-cuenta/page.tsx  (corregido)
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
  const supabaseClient = createClient();

  const [otpSent, setOtpSent] = useState(false);
  const [phoneForOtp, setPhoneForOtp] = useState('');
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
    if (msg.includes('already registered') || msg.includes('user already exists'))
      return 'Este usuario ya está registrado. Probá iniciar sesión.';
    if (msg.includes('rate limit') || msg.includes('too many requests'))
      return 'Demasiados intentos. Esperá un momento antes de reintentar.';
    if (msg.includes('invalid phone'))
      return 'El teléfono no es válido. Usá formato internacional, por ejemplo +5491123456789.';
    if (msg.includes('invalid email')) return 'El email no es válido. Revisá el formato.';
    return message;
  };

  const onSubmit = async (data: FormData) => {
    setError('');
    setLoading(true);
    try {
      if (data.method === 'email') {
        const { error: signUpError } = await supabaseClient.auth.signUp({
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
        const { error: signUpError } = await supabaseClient.auth.signUp({
          phone: data.phone!,
          password: data.password,
          options: {
            channel: 'sms',
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
    setError('');
    setLoading(true);
    try {
      const { error: verifyError } = await supabaseClient.auth.verifyOtp({
        phone: phoneForOtp,
        token: otp,
        type: 'sms',
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

  // ...JSX igual al tuyo, sin cambios en estructura...
}
