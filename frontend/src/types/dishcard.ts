// types.ts
export interface DishCardProps {
  dish: {
    id: string;
    name: string;
    description: string;
    price_cents: number;
    photos: string[];
    producer: {
      name: string;
      approximate_location: string;
      rating: number;
      distance_km?: number;
    };
    active_today: boolean;
    tags: string[];
  };
  isAuthenticated: boolean;
  onAddToCart: (dishId: string) => void;
  onViewDetails: (dishId: string) => void;
  isLoading?: boolean;
  isError?: boolean;
}