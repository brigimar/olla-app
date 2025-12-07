'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, createClient } from '@/lib/supabase/client';
import Image from 'next/image';

type Producer = {
  id: string;
  business_name: string;
  description: string | null;
  address: string | null;
  email: string;
  phone: string;
  logo_url?: string;
  is_active: boolean;
  visible?: boolean;
};

export default function ProducerDashboard() {
  const [producer, setProducer] = useState<Producer | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadProducer() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('producers')
        .select('*')
        .eq('id', user.id)
        .single<Producer>();

      if (error || !data) {
        router.push('/registro-cocinero');
        return;
      }

      setProducer(data);
      setLoading(false);
    }

    loadProducer();
  }, [router]);

  if (loading) return <p className="p-4 text-center text-gray-600">Cargando...</p>;

  if (!producer) return null;

  return (
    <div className="mx-auto max-w-2xl py-10">
      <h1 className="mb-6 text-3xl font-bold">Panel de Productor</h1>

      <div className="space-y-4 rounded-xl bg-white p-6 shadow">
        {producer.logo_url && (
          <div className="flex justify-center">
            <Image
              src={producer.logo_url}
              width={120}
              height={120}
              alt="Logo"
              className="rounded-full border shadow"
            />
          </div>
        )}

        <h2 className="text-2xl font-semibold">{producer.business_name}</h2>

        {producer.description && <p className="text-gray-700">{producer.description}</p>}

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p>{producer.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Teléfono</p>
            <p>{producer.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Dirección</p>
            <p>{producer.address || 'No especificada'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <p>{producer.is_active ? '✔️ Activo' : '❌ Inactivo'}</p>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard/editar')}
          className="mt-6 rounded-lg bg-black px-5 py-2 text-white hover:bg-gray-800"
        >
          Editar Perfil
        </button>
      </div>
    </div>
  );
}
