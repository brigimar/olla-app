"use client";

import { useState } from "react";
import { ProducerServerSchema } from "@/lib/validations/producer";
import { z } from "zod";
import { useSupabase } from "@/lib/supabase/client"; // ✅ import correcto al inicio

type ProducerFormData = z.infer<typeof ProducerServerSchema> & {
  logo_url?: string | null;
  visible?: boolean;
  is_active?: boolean;
};

type UpsertResult = { success: true } | { success: false; error: string };

export function useProducer() {
  const supabase = useSupabase(); // ✅ instancia única
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrUpdateProducer = async (
    data: ProducerFormData,
    logoFile?: File | null
  ): Promise<UpsertResult> => {
    setLoading(true);
    setError(null);

    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      const user = userData?.user;
      if (authError || !user) throw new Error("No autenticado");

      const parsed = ProducerServerSchema.safeParse(data);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        throw new Error(first?.message || "Datos inválidos");
      }

      let logoUrl: string | null = data.logo_url ?? null;
      if (logoFile) {
        const timestamp = Date.now();
        const extension = "webp";
        const fileName = `logo-${timestamp}.${extension}`;
        const path = `cocineros/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("cocineros")
          .upload(path, logoFile, {
            upsert: true,
            contentType: `image/${extension}`,
          });

        if (uploadError) throw new Error("Error al subir logo");

        const { data: urlData } = await supabase.storage
          .from("cocineros")
          .getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }

      const payload = {
        id: user.id,
        business_name: data.business_name,
        description: data.description ?? null,
        address: data.address ?? null,
        email: data.email,
        phone: data.phone ?? null,
        logo_url: logoUrl,
        visible: data.visible ?? false,
        is_active: data.is_active ?? false,
      };

      const { error: upsertError } = await supabase
        .from("producers")
        .upsert(payload, { onConflict: "id" });

      if (upsertError) throw new Error("Error al guardar negocio");

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const getProducer = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      const user = userData?.user;
      if (authError || !user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("producers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw new Error("Error al obtener negocio");
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createOrUpdateProducer,
    getProducer,
  };
}
