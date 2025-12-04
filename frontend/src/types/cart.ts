// src/types/cart.ts
export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type CartResult = {
  items: CartItem[];
  total: number;
};
