import { Dish } from './dish';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  dish?: Dish; // opcional, si querés vincular al plato completo
}

export interface CartResult {
  items: CartItem[];
  total: number;
}



