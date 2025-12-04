// src/types/cart.ts
export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  dish?: Dish; // si querés vincular al plato completo
};

export type CartResult = {
  items: CartItem[];
  total: number;
};
