'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function FormCocineroBreve() {
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    try {
      // -----------------------------
      // 1. Validaciones previas
      // -----------------------------
      if (!formData.email.includes('@')) {
        throw new Error('El email no es válido.');
      }

      if (formData.whatsapp.length < 6) {
        throw new Error('El número de WhatsApp es demasiado corto.');
      }

      // -----------------------------
      // 2. Verificar si ya existe un pending_registrations con ese mail
      // -----------------------------
      const { data: existingPending } = await supabase
        .from('pending_registrations')
        .select('email')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingPending) {
        throw new Error('Ya existe un registro pendiente con este email.');
      }

      // -----------------------------
      // 3. Guardar en pending_registrations
      // -----------------------------
      const { error: pendingError } = await supabase
        .from('pending_registrations')
        .insert([
          {
            name: formData.nombre,
            email: formData.email,
            whatsapp: formData.whatsapp,
          },
        ]);

      if (pendingError) throw pendingError;

      // -----------------------------
      // 4. Crear usuario en Auth
      // ⚠ Password segura generada rústicamente (sin crypto.randomUUID)
      // -----------------------------
      const tempPassword = Math.random().toString(36).slice(-12);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/bienvenida`,
          emailRedirectToOptions: {
            type: 'signup',
          },
        },
      });

      if (signUpError) {
        // Si falla la creación en auth, revertimos la pending_registrations
        await supabase
          .from('pending_registrations')
          .delete()
          .eq('email', formData.email);

        throw signUpError;
      }

      if (!data.user) throw new Error('No se pudo crear el usuario.');

      // -----------------------------
      // 5. Éxito
      // -----------------------------
      setSuccessMessage(
        '✅ Registro exitoso. Revisa tu correo para verificar tu cuenta y completar tu perfil.'
      );

      setFormData({ nombre: '', email: '', whatsapp: '' });

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg space-y-6 p-8 rounded-lg shadow-lg bg-white"
    >
      <h2 className="text-center text-3xl font-extrabold text-indigo-700">
        Registro breve de Cocinero
      </h2>

      <div className="space-y-4">
        <input
          type="text"
          name="nombre"
          placeholder="Nombre del negocio"
          required
          value={formData.nombre}
          onChange={handleChange}
          className="w-full rounded-md border px-3 py-2 focus:ring focus:ring-indigo-300"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full rounded-md border px-3 py-2 focus:ring focus:ring-indigo-300"
        />

        <input
          type="text"
          name="whatsapp"
          placeholder="WhatsApp"
          required
          value={formData.whatsapp}
          onChange={handleChange}
          className="w-full rounded-md border px-3 py-2 focus:ring focus:ring-indigo-300"
        />
      </div>

      {formError && <p className="text-red-600">{formError}</p>}
      {successMessage && <p className="text-green-600">{successMessage}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-indigo-600 py-2 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Registrando...' : 'Registrar Cocinero'}
      </button>
    </form>
  );
}
