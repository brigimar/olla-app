export type Dish = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  destacado: boolean;
  price_cents: number;
  status: "active" | "inactive" | string | null;
  is_available: boolean;
};
