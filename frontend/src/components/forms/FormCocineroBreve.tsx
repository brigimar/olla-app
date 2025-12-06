'use client';
//frontend\src\components\forms\FormCocineroBreve.tsx
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

export default function FormCocineroBreve() {
  const { signUp, loading: authLoading } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estado controlado de los inputs
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    whatsapp: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    try {
      // 1. Guardar datos básicos en pending_registrations
      const { error: pendingError } = await supabase.from('pending_registrations').insert([
        {
          name: formData.nombre,
          email: formData.email,
          whatsapp: formData.whatsapp,
        },
      ]);
      if (pendingError) throw pendingError;

      // 2. Crear usuario en Auth (Supabase envía email de verificación)
      const { user, error: signUpError } = await signUp(formData.email, crypto.randomUUID());
      if (signUpError) throw new Error(signUpError.message);
      if (!user) throw new Error('No se pudo crear el usuario');

      setSuccessMessage(
        '✅ Registro inicial exitoso. Verifica tu correo y luego completa tu perfil.'
      );

      // Resetear el estado de los inputs
      setFormData({ nombre: '', email: '', whatsapp: '' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setFormError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6 p-8 shadow-lg">
      <h2 className="text-center text-3xl font-extrabold">Registro breve de Cocinero</h2>
      <div className="space-y-4">
        <input
          type="text"
          name="nombre"
          placeholder="Nombre del negocio"
          required
          value={formData.nombre}
          onChange={handleChange}
          className="w-full rounded-md border px-3 py-2"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full rounded-md border px-3 py-2"
        />
        <input
          type="text"
          name="whatsapp"
          placeholder="WhatsApp"
          required
          value={formData.whatsapp}
          onChange={handleChange}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      {formError && <p className="text-red-600">{formError}</p>}
      {successMessage && <p className="text-green-600">{successMessage}</p>}

      <button
        type="submit"
        disabled={authLoading}
        className="w-full rounded-md bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {authLoading ? 'Registrando...' : 'Registrar Cocinero'}
      </button>
    </form>
  );
}
