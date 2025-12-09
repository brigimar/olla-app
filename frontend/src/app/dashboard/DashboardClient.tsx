// app/dashboard/DashboardClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/client";

type Producer = {
  id: string;
  business_name: string;
  is_active: boolean;
  // ... otros campos
};

export default function DashboardClient({ producer }: { producer: Producer }) {
  const router = useRouter();
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);

  // Ejemplo: si necesitas hacer algo interactivo (ej. actualizar estado)
  const toggleActive = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('producers')
      .update({ is_active: !producer.is_active })
      .eq('id', producer.id);

    if (!error) {
      // Actualizar estado local
      // o hacer refetch
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Hola, {producer.business_name}</h1>
      <p className="mt-2 text-gray-600">
        Estado de actividad: {producer.is_active ? 'Activo' : 'Inactivo'}
      </p>
      <button
        onClick={toggleActive}
        disabled={loading}
        className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
      >
        {loading ? 'Actualizando...' : 'Cambiar estado'}
      </button>
    </div>
  );
}