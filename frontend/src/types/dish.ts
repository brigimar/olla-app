// src/types/dish.ts
export type Dish = {
  id: string;
  producer_id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url?: string;
  category?: string;
  is_available: boolean;
  preparation_time_minutes: number | null;
};
