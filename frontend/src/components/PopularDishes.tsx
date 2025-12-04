"use client";

import Image from "next/image";
import { normalizeImageUrl } from "@/utils/image";
import { usePopularDishes } from "@/hooks/usePopularDishes";
import type { Dish } from "@/types/database.types";
import React from "react";

type Props = {
  title?: string;
  description?: string;
};

export default function PopularDishes({
  title = "Platos destacados",
  description,
}: Props) {
  const { dishes = [], loading, error } = usePopularDishes();

  if (loading) {
    return (
      <div className="p-10 text-center text-muted">
        Cargando nuestras especialidades...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center text-tomato">
        Error cargando menú. Intente más tarde.
      </div>
    );
  }

  return (
    <section className="bg-warm-cream py-16" id="explore">
      <div className="container mx-auto px-4">
        {/* Título corregido */}
        <h2 className="text-center text-3xl md:text-4xl font-[Poppins] font-bold text-dark-graphite mb-4">
          {title}
        </h2>

        {/* Subtítulo corregido */}
        {description && (
          <p className="text-center text-muted text-sm md:text-base max-w-xl mx-auto mb-10">
            {description}
          </p>
        )}

        <div className="cards-grid mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish: Dish, idx: number) => (
            <DishCard key={dish.id ?? idx} dish={dish} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- DishCard (unificado) ---------------- */

function DishCard({ dish }: { dish: Dish }) {
  return (
    <article className="dish-card rounded-xl overflow-hidden bg-white border border-border shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-2">
      {/* Imagen */}
      <div className="dish-image h-52 w-full relative overflow-hidden">
        <Image
          src={normalizeImageUrl(dish.image_url ?? "/placeholder-plate.jpg")}
          alt={dish.name ?? "plato"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badge de categoría */}
        {dish.category && (
          <span className="absolute right-3 top-3 rounded-full bg-black/60 backdrop-blur-sm text-white px-3 py-1 text-xs uppercase tracking-wide">
            {dish.category}
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="dish-content p-6">
        <span className="neighborhood-badge inline-block mb-3 bg-olive-soft text-white px-3 py-1 rounded-full text-sm font-semibold">
          Hecho en tu barrio
        </span>

        <h3 className="dish-title text-dark-graphite text-xl font-bold mb-2">
          {dish.name}
        </h3>

        {dish.description && (
          <p className="dish-description text-olive-soft text-sm mb-4 line-clamp-3">
            {dish.description}
          </p>
        )}

        {/* Precio */}
        {dish.price !== undefined && (
          <div className="dish-price text-tomato text-2xl font-extrabold mb-3">
            {typeof dish.price === "number" ? `$${dish.price}` : dish.price}
          </div>
        )}

        {/* Meta: rating + distancia */}
        <div className="dish-meta flex items-center justify-between text-sm mb-4">
          <div className="rating text-gold-accent flex items-center gap-2 font-semibold">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-gold-accent"
            >
              <path d="M12 .587l3.668 7.431L23 9.748l-5.5 5.356L18.335 24 12 19.897 5.665 24 7.5 15.104 2 9.748l7.332-1.73z" />
            </svg>
            <span>{dish.rating ?? "—"}</span>
          </div>

          <div className="location text-olive-soft flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-olive-soft"
            >
              <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
            </svg>
            <span>{dish.distance ?? "— km"}</span>
          </div>
        </div>

        {/* Trust badges */}
        <div className="trust-badges flex gap-2 flex-wrap mb-4">
          {(dish.trust_badges ?? ["Verificado por OllaApp"])
            .slice(0, 3)
            .map((b: string, i: number) => (
              <span
                key={i}
                className="trust-badge bg-cream-light text-olive-soft px-3 py-1 rounded-md text-xs font-semibold"
              >
                {b}
              </span>
            ))}
        </div>

        {/* CTA */}
        <div>
          <button className="btn btn-primary w-full flex items-center justify-center gap-3 bg-tomato text-white py-3 rounded-full font-semibold shadow-md hover:bg-tomato-light transition">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm0-2h14V6H7v10zm0-12h14c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5" />
            </svg>
            Reservar
          </button>
        </div>
      </div>
    </article>
  );
}
