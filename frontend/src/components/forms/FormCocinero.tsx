// src/components/forms/FormCocinero.tsx  (Bloque 1 corregido)
'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProducer } from '@/hooks/useProducers';

type ProducerFormData = {
  email: string;
  password: string;
  business_name: string;
  description?: string | null;
  address: string;
  phone: string;
  logo?: File | null;
  logo_url?: string | null;
  visible?: boolean;
  is_active?: boolean;
};

export default function FormCocinero() {
  const { signUp, loading: authLoading } = useAuth();
  const { createOrUpdateProducer, loading: profileLoading, error: profileError } = useProducer();

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProducerFormData>({
    email: '',
    password: '',
    business_name: '',
    description: '',
    address: '',
    phone: '',
    logo: null,
    logo_url: null,
    visible: false,
    is_active: true,
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

  const validateForm = () => {
    if (!formData.email.includes('@')) throw new Error('El email no es válido.');
    if (formData.password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
    if (formData.phone.length < 6) throw new Error('El teléfono es demasiado corto.');
    if (formData.business_name.trim().length < 2) throw new Error('El nombre del negocio es demasiado corto.');
    if (!formData.address.trim()) throw new Error('Debes ingresar una dirección.');
  };

  // src/components/forms/FormCocinero.tsx  (Bloque 2 corregido)
  // -------------------------
  // Submit
  // -------------------------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    try {
      validateForm();

      // ---- 1. Crear usuario en Auth ----
      const { user } = await signUp('email', formData.email, formData.password);

      if (!user) {
        throw new Error('No se pudo crear el usuario.');
      }

      // ---- 2. Crear perfil en producers ----
      await createOrUpdateProducer(
        {
          business_name: formData.business_name,
          description: formData.description,
          address: formData.address,
          email: formData.email,
          phone: formData.phone,
          logo_url: formData.logo_url,
          visible: formData.visible,
          is_active: formData.is_active,
        },
        formData.logo || undefined
      );

      // ---- 3. Éxito ----
      setSuccessMessage('✅ Cocinero registrado exitosamente.');

      setFormData({
        email: '',
        password: '',
        business_name: '',
        description: '',
        address: '',
        phone: '',
        logo: null,
        logo_url: null,
        visible: false,
        is_active: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido.';
      setFormError(message);
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

      {/* ...inputs como en el bloque anterior... */}

      {/* Errores */}
      {(formError || profileError) && (
        <p className="text-sm font-medium text-red-600">{formError || profileError}</p>
      )}

      {/* Éxito */}
      {successMessage && <p className="text-sm font-medium text-green-600">{successMessage}</p>}

      {/* Botón */}
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
