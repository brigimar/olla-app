// types/hooks.ts
import { User } from '@supabase/supabase-js';

// === Core Data Types ===
export interface Location {
  lat: number;
  lng: number;
  partido?: string;
  source: 'auto' | 'manual';
}

export interface Producer {
  id: string;
  name: string;
  approximate_location: [number, number];
  rating: number;
  delivery_zones: string[];
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  photos: string[];
  producer_id: string;
  producer: Producer;
  active_today: boolean;
  tags: string[];
  distance_km?: number;
}

export interface CartItem {
  id: string;
  dish: Dish;
  quantity: number;
  added_at: Date;
}

// === Filter Types ===
export interface DishFilters {
  location?: Location;
  radius_km?: number;
  max_price?: number;
  tags?: string[];
  search_query?: string;
}

// === Error Types ===
export enum GeolocationError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  POSITION_UNAVAILABLE = 'POSITION_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  UNSUPPORTED = 'UNSUPPORTED',
  UNKNOWN = 'UNKNOWN',
}

export enum SupabaseError {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  QUERY_ERROR = 'QUERY_ERROR',
  UNKNOWN = 'UNKNOWN',
}

// === Hook Return Types ===
export interface GeolocationResult {
  location: Location | null;
  error: GeolocationError | null;
  loading: boolean;
  getCurrentLocation: () => void;
  clearLocation: () => void;
}

export interface DishesResult {
  dishes: Dish[];
  loading: boolean;
  error: SupabaseError | null;
  refetch: () => Promise<void>;
}

export interface AuthResult {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export interface CartResult {
  items: CartItem[];
  total: number;
  addItem: (dish: Dish, quantity?: number) => void;
  removeItem: (dishId: string) => void;
  clearCart: () => void;
  updateQuantity: (dishId: string, quantity: number) => void;
}
