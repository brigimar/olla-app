'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProducers } from '@/hooks/useProducers';

export default function FormCocinero() {
  const { signUp, loading: authLoading } = useAuth();
  const { createProfile, loading: profileLoading, error: profileError } = useProducers();

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLoading = authLoading || profileLoading;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const businessName = formData.get('businessName') as string;
    const description = formData.get('description') as string;
    const address = formData.get('address') as string;
    const phone = formData.get('phone') as string;
    const logo = formData.get('logo') as File | null;

    try {
      // Paso 1: Crear usuario en Auth con rol 'productor'
      const { user, error: signUpError } = await signUp(email, password, 'productor');
      if (signUpError) throw new Error(signUpError.message);
      if (!user) throw new Error('No se pudo crear el usuario');

      // Paso 2: Crear perfil en producers con los campos correctos
      await createProfile(
        user.id,
        {
          business_name: businessName,
          description,
          address,
          email,
          phone,
        },
        logo || undefined
      );

      setSuccessMessage('✅ Cocinero registrado exitosamente');
      e.currentTarget.reset();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setFormError(errorMessage);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg space-y-6 rounded-xl bg-gradient-to-br from-white to-gray-50 p-8 shadow-lg"
    >
      <h2 className="text-center text-3xl font-extrabold text-gray-800">
        Registro de Cocinero
      </h2>
      <p className="text-center text-sm text-gray-500">
        Completa tus datos para comenzar a vender tus platos
      </p>

      <div className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          required
        />
        <input
          type="text"
          name="businessName"
          placeholder="Nombre del negocio"
          className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          required
        />
        <textarea
          name="description"
          placeholder="Descripción del negocio"
          className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <input
          type="text"
          name="address"
          placeholder="Dirección"
          className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          required
        />
        <input
          type="text"
          name="phone"
          placeholder="Teléfono"
          className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          required
        />
        <div>
  <label
    htmlFor="logo"
    className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-pink-500 to-red-500 px-4 py-3 text-white font-semibold shadow hover:from-pink-400 hover:to-red-400 transition-all duration-200"
  >
    📤 Subir logo
  </label>
  <input
    id="logo"
    type="file"
    name="logo"
    accept="image/*"
    className="hidden"
  />
</div>

      </div>

      {(formError || profileError) && (
        <p className="text-red-600 text-sm font-medium">{formError || profileError}</p>
      )}
      {successMessage && (
        <p className="text-green-600 text-sm font-medium">{successMessage}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white font-semibold shadow hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 disabled:opacity-50"
      >
        {isLoading ? 'Registrando...' : 'Registrar Cocinero'}
      </button>
    </form>
  );
}
