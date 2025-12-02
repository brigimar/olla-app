"use client";

import { useQuery } from "@tanstack/react-query";
import { Dish } from "@/types/database.types";
import { dishesService } from "@/services/dishesService";

// ─── INTERFACES ───────────────────────────────────────────────────────────────

export interface UseDishesOptions {
  enabled?: boolean;
  staleTime?: number;
}

export interface UsePopularDishesOptions extends UseDishesOptions {
  limit?: number;
  city?: string;
}

// ─── ERRORES PERSONALIZADOS ───────────────────────────────────────────────────

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

// Transforma errores de Supabase a errores tipados
function handleSupabaseError(error: any): Error {
  if (error?.code === "PGRST116") {
    return new NotFoundError("Plato no encontrado");
  }
  if (error?.code === "NETWORK_ERROR" || error?.message?.includes("network")) {
    return new NetworkError("Error de red. Verifica tu conexión.");
  }
  return new Error(error?.message || "Error al cargar los datos");
}

// ─── QUERY FUNCTIONS ──────────────────────────────────────────────────────────

const fetchPopularDishes = async ({
  limit = 10,
  city,
}: {
  limit?: number;
  city?: string;
}) => {
  try {
    if (city) {
      return await dishesService.getDishesByCity(city);
    }
    return await dishesService.getPopularDishes(limit);
  } catch (error: any) {
    throw handleSupabaseError(error);
  }
};

const fetchDishById = async (id: string) => {
  try {
    const dish = await dishesService.getDishById(id);
    if (!dish) {
      throw new NotFoundError("Plato no encontrado");
    }
    return dish;
  } catch (error: any) {
    throw handleSupabaseError(error);
  }
};

const fetchDishesByCity = async (city: string) => {
  try {
    return await dishesService.getDishesByCity(city);
  } catch (error: any) {
    throw handleSupabaseError(error);
  }
};

// ─── HOOKS ────────────────────────────────────────────────────────────────────

export const usePopularDishes = (
  options: UsePopularDishesOptions = {}
) => {
  const {
    limit = 10,
    city,
    enabled = true,
    staleTime = 1000 * 60 * 5,
  } = options;

  return useQuery<Dish[], Error>({
    queryKey: ["dishes", "popular", { city, limit }],
    queryFn: () => fetchPopularDishes({ limit, city }),
    enabled: enabled && (!city || typeof city === "string"),
    staleTime,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useDishById = (
  id: string,
  options: UseDishesOptions = {}
) => {
  const { enabled = true, staleTime = 1000 * 60 * 5 } = options;

  return useQuery<Dish, Error>({
    queryKey: ["dishes", id],
    queryFn: () => fetchDishById(id),
    enabled: enabled && !!id,
    staleTime,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useDishesByCity = (
  city: string,
  options: UseDishesOptions = {}
) => {
  const { enabled = true, staleTime = 1000 * 60 * 5 } = options;

  return useQuery<Dish[], Error>({
    queryKey: ["dishes", "city", city],
    queryFn: () => fetchDishesByCity(city),
    enabled: enabled && !!city,
    staleTime,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
