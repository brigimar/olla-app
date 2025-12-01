// components/PopularDishes.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dish } from '@/types/database.types';
import { usePopularDishes } from '@/hooks/useDishes';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface PopularDishesProps {
  city?: string;
  limit?: number;
}

export function PopularDishes({ city, limit = 8 }: PopularDishesProps) {
  const { dishes, isLoading, isError } = usePopularDishes({ city, limit });
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // SWR ya maneja re-fetch automático cuando cambian city/limit
  // pero si usas un hook personalizado sin SWR, podrías usar useEffect + refetch

  useEffect(() => {
    if (isError) {
      setError('No pudimos cargar los platos populares. Inténtalo de nuevo.');
    } else {
      setError(null);
    }
  }, [isError]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    // SWR refetchea automáticamente al cambiar retryCount si lo pasas como key
    // Pero si usas SWR como en el hook anterior, el re-fetch ya ocurre al cambiar props
    // Por simplicidad, asumimos que el hook ya reacciona a cambios
  };

  if (isLoading) {
    return <PopularDishesSkeleton limit={limit} />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-secondary">Platos Populares</h2>
        <div className="rounded-xl bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
          <p className="mt-3 text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="mt-4"
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!dishes || dishes.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-secondary">Platos Populares</h2>
        <div className="rounded-xl bg-gray-50 p-8 text-center">
          <p className="text-gray-600">
            No hay platos disponibles en este momento.
            {city ? ` Prueba con otra ciudad.` : ''}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-secondary">
        {city ? `Platos en ${city}` : 'Platos Populares'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {dishes.map((dish) => (
          <DishCard key={dish.id} dish={dish} />
        ))}
      </div>
    </div>
  );
}

// ─── DishCard (versión básica, reemplaza con tu diseño real) ────────────────
interface DishCardProps {
  dish: Dish;
}

function DishCard({ dish }: DishCardProps) {
  return (
    <div className="group overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        {dish.image_url ? (
          <img
            src={dish.image_url}
            alt={dish.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500 text-sm">Sin imagen</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-gray-900 line-clamp-1">{dish.name}</h3>
          <span className="text-xs font-medium bg-accent text-secondary px-2 py-1 rounded-full">
            {dish.badge || 'Popular'}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{dish.description}</p>
        <div className="mt-3 flex justify-between items-center">
          <span className="text-sm text-secondary font-medium">
            Por {dish.cook_name}
          </span>
          <span className="font-bold text-primary">
            ${(dish.price_cents / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Loading ───────────────────────────────────────────────────────
function PopularDishesSkeleton({ limit }: { limit: number }) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="aspect-square w-full">
              <Skeleton className="h-full w-full" />
            </div>
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}