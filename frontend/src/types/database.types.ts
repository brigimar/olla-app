// types/database.types.ts
//npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > types/database.types.ts

export type Dish = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  destacado: boolean;
  price_cents: number;
  status: 'active' | 'inactive' | string | null;
  is_available: boolean;
};
export interface FilterOptions {
  distance: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  tags: string[];
  searchQuery: string;
}

export interface Database {
  public: {
    Tables: {
      dishes: {
        Row: {
          id: string;
          name: string;
          description: string;
          cook_name: string;
          status: string; // 'active' | 'inactive'
          image_url: string;
          price_cents: number;
          rating: number;
          city: string;
          badge: string | null;
          created_at: string; // ISO
          updated_at: string; // ISO
        };
        Insert: {
          id?: string; // auto-generado en Supabase con UUID
          name: string;
          description: string;
          cook_name: string;
          status?: string;
          image_url?: string;
          price_cents: number;
          rating?: number;
          city: string;
          badge?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          cook_name?: string;
          status?: string;
          image_url?: string;
          price_cents?: number;
          rating?: number;
          city?: string;
          badge?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}




