// src/types/dish.ts
export type Dish = {
  id: string;
  producer_id: string;   // ✅ agregado
  name: string;
  description: string;
  price_cents: number;
};
