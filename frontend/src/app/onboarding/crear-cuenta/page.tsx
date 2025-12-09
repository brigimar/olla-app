// src/app/onboarding/crear-cuenta/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSupabase } from "@/lib/supabase/client";
import { signUpSchema, type SignUpFormData } from "@/lib/validations/signUp";

export default function CrearCuentaPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // ✅ Verificar si ya hay sesión activa
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace("/dashboard");
        } else {
          setSessionChecked(true);
        }
      } catch (err) {
        console.error("Error checking session:", err);
        setSessionChecked(true);
      }
    };

    checkSession();
  }, [router, supabase]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const mapAuthError = (message?: string): string => {
    if (!message) return "Ocurrió un error. Intentá nuevamente.";
    const msg = message.toLowerCase();

    if (msg.includes("already registered") || msg.includes("user already exists"))
      return "Este usuario ya está registrado. Probá iniciar sesión.";

    if (msg.includes("rate limit") || msg.includes("too many requests"))
      return "Demasiados intentos. Esperá un momento antes de reintentar.";

    if (msg.includes("invalid email")) return "El email no es válido. Revisá el formato.";

    return "Ocurrió un error. Intentá nuevamente.";
  };

  const onSubmit = async (formValues: SignUpFormData) => {
    setError("");
    setLoading(true);

    try {
      // ✅ Usar NEXT_PUBLIC_SITE_URL en lugar de window.location.origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!siteUrl) {
  throw new Error("NEXT_PUBLIC_SITE_URL no está definido. " +
    "Agrégalo a tu archivo .env.local");
}

      const { error: signUpError, data } = await supabase.auth.signUp({
        email: formValues.email,
        password: formValues.password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
          data: { 
            name: formValues.name,
            full_name: formValues.name,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // ✅ Verificar si se requiere confirmación por email
      if (data?.user?.identities?.length === 0) {
        throw new Error("Este email ya está registrado.");
      }

      router.push("/onboarding/espera-email");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      setError(mapAuthError(message));
    } finally {
      setLoading(false);
    }
  };

  // ✅ Esperar a verificar sesión antes de renderizar el formulario
  if (!sessionChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        <p className="ml-2 text-gray-600">Verificando sesión...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Crear cuenta</h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre completo
            </label>
            <input
              id="name"
              {...register("name")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Tu nombre completo"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              {...register("email")}
              type="email"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="tu@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              {...register("password")}
              type="password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Mínimo 6 caracteres"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              {...register("confirmPassword")}
              type="password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Repetí tu contraseña"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Creando cuenta...
              </span>
            ) : (
              "Registrarme"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            ¿Ya tenés cuenta?{" "}
            <button
              onClick={() => router.push("/auth/login")}
              className="font-medium text-green-600 hover:text-green-500"
            >
              Iniciar sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}