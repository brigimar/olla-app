// src/types/dish.ts
export type Dish = {
  id: string;
  producer_id: string;                // vínculo al productor
  name: string;
  description: string;
  price_cents: number;
  image_url?: string;                 // opcional si no siempre hay imagen
  category?: string;                  // ej: "pastas", "postres"
  is_available: boolean;
  preparation_time_minutes: number | null;
  city?: string;                      // ubicación del plato/productor
  status: 'active' | 'inactive';      // estado del plato
  rating: number;                     // puntuación inicial
  destacado?: boolean;                // marcar como destacado
};
