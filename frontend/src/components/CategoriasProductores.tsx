'use client';

import Link from 'next/link';
import { Pizza, Soup, Home, Utensils } from 'lucide-react';

const categoriasProductores = [
  { name: 'Rotiserías', icon: Utensils },
  { name: 'Caseras', icon: Soup },
  { name: 'Pizzerías', icon: Pizza },
  { name: 'Hogareñas', icon: Home },
];

export default function CategoriasProductores() {
  return (
    <section className="w-full bg-warm-cream py-16">
      <div className="container">
        <h2 className="mb-4 text-center font-[Poppins] text-3xl font-bold text-dark-graphite md:text-4xl">
          Categorías de productores
        </h2>
        <p className="mb-10 text-center text-sm text-muted md:text-base">
          Explorá agrupaciones de platos según el tipo de cocina o emprendimiento
        </p>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {categoriasProductores.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link
                key={idx}
                href={`/explorar?productor=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-sm-custom transition hover:shadow-md-custom"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-tomato text-white">
                  <Icon className="h-7 w-7" />
                </div>
                <span className="text-sm font-semibold text-dark-graphite">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
