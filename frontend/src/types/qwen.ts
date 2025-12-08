// types.ts
export interface Producer {
  id: string;
  name: string;
  approximate_location: [number, number]; // [lat, lng]
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
  active_today: boolean;
  distance_meters?: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  polygon_coordinates: [number, number][]; // [[lat, lng], ...]
}

export type FilterOptions = {
  distance: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  tags: string[];
  searchQuery: string;
};



