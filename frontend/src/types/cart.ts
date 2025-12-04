import type { Dish } from './dish';

export interface CartItem {
  id: string;
  dish: Dish;
  quantity: number;
  added_at: Date;
}

export interface CartResult {
  items: CartItem[];
  total: number;
  addItem: (dish: Dish, quantity?: number) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
}
