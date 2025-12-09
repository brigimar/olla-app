// src/hooks/usePopularDishes.ts
"use client"; // ?? CRï¿½TICO: Agregar esta directiva

import { useEffect, useState } from "react";
import { useSupabase } from "@/lib/supabase/client";

interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  // ... otros campos
}

export function usePopularDishes() {
  const supabase = useSupabase();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchDishes() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("dishes")
          .select("*")
          .limit(10);

        if (fetchError) throw fetchError;
        setDishes(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Error desconocido"));
      } finally {
        setLoading(false);
      }
    }

    fetchDishes();
  }, [supabase]);

  return { dishes, loading, error };
}
