"use client";

import { useState } from "react";
import { DishServerSchema } from "@/lib/validations/dish";
import { z } from "zod";
import { useSupabase } from "@/lib/supabase/client"; // ? import correcto al inicio

type DishFormData = z.infer<typeof DishServerSchema>;

export function useProductos() {
  const supabase = useSupabase(); // ? instancia �nica
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDish = async (dishData: DishFormData, photoFiles?: File[]) => {
    setLoading(true);
    setError(null);

    try {
      // 1) Validar datos
      const parsed = DishServerSchema.safeParse(dishData);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        throw new Error(first?.message || "Datos inv�lidos");
      }

      // 2) Usuario autenticado
      const { data: userData, error: authError } = await supabase.auth.getUser();
      const user = userData?.user;
      if (authError || !user) throw new Error("No autenticado");

      // 3) Subir fotos opcionales
      const photoUrls: string[] = [];
      if (photoFiles && photoFiles.length > 0) {
        for (const file of photoFiles) {
          const timestamp = Date.now();
          const fileName = `dish-${timestamp}-${file.name}`;
          const path = `dishes/${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("dishes")
            .upload(path, file, { upsert: true });

          if (uploadError) throw new Error("Error al subir foto");

          const { data: urlData } = supabase.storage.from("dishes").getPublicUrl(path);
          photoUrls.push(urlData.publicUrl);
        }
      }

      // 4) Insertar plato en tabla dishes
      const payload = {
        user_id: user.id,
        name: dishData.name,
        description: dishData.description ?? null,
        price: dishData.price,
        category: dishData.category ?? null,
        visible: dishData.visible ?? true,
        photos: photoUrls,
      };

      const { error: insertError } = await supabase.from("dishes").insert(payload);
      if (insertError) throw new Error("Error al guardar plato");

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const getDishes = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      const user = userData?.user;
      if (authError || !user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw new Error("Error al obtener platos");
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
    createDish,
    getDishes,
  };
}

