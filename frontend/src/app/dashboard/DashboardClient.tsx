// app/dashboard/DashboardClient.tsx
"use client";

import { useState } from "react";
import { useSupabase } from "@/lib/supabase/client";

type Producer = {
  id: string;
  business_name: string;
  is_active: boolean;
  email?: string;
  phone?: string;
  logo_url?: string;
  address?: string;
  description?: string;
};

export default function DashboardClient({ producer }: { producer: Producer }) {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);
  const [localProducer, setLocalProducer] = useState<Producer>(producer);

  const toggleActive = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('producers')
        .update({ 
          is_active: !localProducer.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', localProducer.id);

      if (error) throw error;
      
      // Actualizar estado local
      setLocalProducer(prev => ({
        ...prev,
        is_active: !prev.is_active
      }));
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      // Aquí podrías agregar un toast de error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Hola, {localProducer.business_name}</h1>
      <p className="mt-2 text-gray-600">
        Estado de actividad: {localProducer.is_active ? 'Activo' : 'Inactivo'}
      </p>
      <button
        onClick={toggleActive}
        disabled={loading}
        className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
        aria-label={`Cambiar estado a ${localProducer.is_active ? 'inactivo' : 'activo'}`}
      >
        {loading ? 'Actualizando...' : 'Cambiar estado'}
      </button>
    </div>
  );
}