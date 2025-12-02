// components/DishCard.tsx
'use client';

import { Dish } from '@/types/database.types';
import { Rating } from '@/components/ui/Rating';
import { Button } from '@/components/ui/Button';
import { ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Image from "next/image";
import { normalizeImageUrl } from "@/utils/image";

export default function DishCard({ dish }) {
  return (
    <div className="card">
      <Image
        src={normalizeImageUrl(dish.image_url)}
        alt={dish.name}
        width={400}
        height={300}
        className="object-cover rounded"
      />
      <h3>{dish.name}</h3>
      <p>{dish.description}</p>
    </div>
  );
}


interface DishCardProps {
  dish: Dish;
  onAddToCart?: (dish: Dish) => void;
  className?: string;
}

const FALLBACK_IMAGE = '/images/placeholder-dish.jpg'; // Asegúrate de tener esta imagen

export function DishCard({ dish, onAddToCart, className }: DishCardProps) {
  // ─── Formateo de precio ─────────────────────────────────────────────────────
  const formattedPrice = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(dish.price_cents / 100);

  // ─── Badge lógico ───────────────────────────────────────────────────────────
  const getBadge = () => {
    if (dish.badge) return dish.badge;
    if (dish.status === 'active') {
      // Si es nuevo (<7 días), mostrar "Nuevo"
      const createdAt = new Date(dish.created_at);
      const isNew = Date.now() - createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;
      if (isNew) return 'Nuevo';
    }
    return null;
  };

  const badge = getBadge();

  // ─── Manejo de imagen ───────────────────────────────────────────────────────
  const imageUrl = dish.image_url && dish.image_url.trim() !== '' 
    ? dish.image_url 
    : FALLBACK_IMAGE;

  return (
    <div 
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      {/* Imagen del plato */}
      <div className="relative aspect-square w-full bg-gray-100">
        <Image
          src={imageUrl}
          alt={dish.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            // Si la imagen falla, usar fallback
            (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
          }}
          priority={false}
        />
        {badge && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-accent px-2 py-1 text-xs font-bold text-secondary">
            {badge}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex justify-between">
          <h3 className="line-clamp-1 text-sm font-semibold text-secondary">{dish.name}</h3>
          {dish.rating > 0 ? (
            <span className="text-xs font-medium text-gray-500">
              {dish.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        <p className="mt-1 line-clamp-2 text-xs text-gray-600">{dish.description}</p>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>Por {dish.cook_name}</span>
          <span>{dish.city}</span>
        </div>

        {/* Rating o "Nuevo" */}
        <div className="mt-2">
          {dish.rating > 0 ? (
            <Rating value={dish.rating} size="sm" readOnly />
          ) : (
            !badge && (
              <span className="text-xs text-gray-400">Sin valoraciones</span>
            )
          )}
        </div>

        {/* Acción */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-bold text-primary">{formattedPrice}</span>
          {onAddToCart && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddToCart(dish)}
              aria-label={`Agregar ${dish.name} al carrito`}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}