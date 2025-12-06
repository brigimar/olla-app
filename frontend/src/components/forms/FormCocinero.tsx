'use client';
//frontend\src\components\forms\FormCocinero.tsx
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProducers } from '@/hooks/useProducers';

export default function FormCocinero() {
  const { signUp, loading: authLoading } = useAuth();
  const { createProfile, loading: profileLoading, error: profileError } = useProducers();

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: '',
    description: '',
    address: '',
    phone: '',
    logo: null as File | null,
  });

  const isLoading = authLoading || profileLoading;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    try {
      // Paso 1: Crear usuario en Auth
      const { user, error: signUpError } = await signUp(formData.email, formData.password);
      if (signUpError) throw new Error(signUpError.message);
      if (!user) throw new Error('No se pudo crear el usuario');

      // Paso 2: Crear perfil en producers
      await createProfile(
        user.id,
        {
          business_name: formData.businessName,
          description: formData.description,
          address: formData.address,
          email: formData.email,
          phone: formData.phone,
        },
        formData.logo || undefined
      );

      setSuccessMessage('✅ Cocinero registrado exitosamente');
      setFormData({
        email: '',
        password: '',
        businessName: '',
        description: '',
        address: '',
        phone: '',
        logo: null,
      });
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
      <h2 className="text-center text-3xl font-extrabold text-gray-800">Registro de Cocinero</h2>
      <p className="text-center text-sm text-gray-500">
        Completa tus datos para comenzar a vender tus platos
      </p>

      <div className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          required
        />
        <input
          type="text"
          name="businessName"
          placeholder="Nombre del negocio"
          value={formData.businessName}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          required
        />
        <textarea
          name="description"
          placeholder="Descripción del negocio"
          value={formData.description}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <input
          type="text"
          name="address"
          placeholder="Dirección"
          value={formData.address}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          required
        />
        <input
          type="text"
          name="phone"
          placeholder="Teléfono"
          value={formData.phone}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          required
        />
        <div>
          <label
            htmlFor="logo"
            className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-pink-500 to-red-500 px-4 py-3 font-semibold text-white shadow transition-all duration-200 hover:from-pink-400 hover:to-red-400"
          >
            📤 Subir logo
          </label>
          <input
            id="logo"
            type="file"
            name="logo"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
        </div>
      </div>

      {(formError || profileError) && (
        <p className="text-sm font-medium text-red-600">{formError || profileError}</p>
      )}
      {successMessage && <p className="text-sm font-medium text-green-600">{successMessage}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 font-semibold text-white shadow transition-all duration-200 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
      >
        {isLoading ? 'Registrando...' : 'Registrar Cocinero'}
      </button>
    </form>
  );
}
