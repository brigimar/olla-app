"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

export default function ProducerDashboard() {
  const [producer, setProducer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadProducer() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("producers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        router.push("/registro-cocinero");
        return;
      }

      setProducer(data);
      setLoading(false);
    }

    loadProducer();
  }, [router]);

  if (loading)
    return <p className="p-4 text-center text-gray-600">Cargando...</p>;

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Panel de Productor</h1>

      <div className="bg-white shadow p-6 rounded-xl space-y-4">
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

        {producer.description && (
          <p className="text-gray-700">{producer.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 mt-4">
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
            <p>{producer.address || "No especificada"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <p>{producer.is_active ? "✔️ Activo" : "❌ Inactivo"}</p>
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard/editar")}
          className="mt-6 bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800"
        >
          Editar Perfil
        </button>
      </div>
    </div>
  );
}
