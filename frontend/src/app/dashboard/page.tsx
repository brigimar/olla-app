'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from "@/lib/supabase/client";


type Producer = {
  id: string;
  business_name: string;
  is_active: boolean;
};

export default function ProducerDashboard() {
  const supabase = useSupabase(); // ✅ instancia única estable
  const [producer, setProducer] = useState<Producer | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        // 1. Obtener usuario autenticado
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // 2. Obtener productor asociado
        const { data, error } = await supabase
          .from('producers')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (mounted) {
          setProducer(data);
        }
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (!producer) {
    return <p>No se encontraron datos del productor.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Hola, {producer.business_name}</h1>
      <p className="mt-2 text-gray-600">
        Estado de actividad: {producer.is_active ? 'Activo' : 'Inactivo'}
      </p>
    </div>
  );
}
