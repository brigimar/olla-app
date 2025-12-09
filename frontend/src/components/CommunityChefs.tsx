'use client';

import Link from 'next/link';
import { Users, ChefHat, Sparkles } from 'lucide-react';
import React from 'react';

// Interfaces TypeScript
interface ChefCategory {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function CommunityChefs() {
  const categories: ChefCategory[] = [
    {
      id: 'families',
      title: 'Familias',
      subtitle: 'Familias cocinando',
      description: 'Recetas multigeneracionales con tradición y sabor.',
      icon: Users,
    },
    {
      id: 'specialists',
      title: 'Cocineros Expertos',
      subtitle: 'Especialistas',
      description: 'Platos auténticos y elaborados con técnica profesional.',
      icon: ChefHat,
    },
    {
      id: 'emergent',
      title: 'Nuevas Voces',
      subtitle: 'Chefs emergentes',
      description: 'Innovación y creatividad desde la cocina casera.',
      icon: Sparkles,
    },
  ];

  return (
    <section className="w-full bg-white py-24">
      <div className="mx-auto w-full max-w-[1600px] px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="font-[Poppins] text-4xl font-bold text-dark-graphite md:text-5xl">
            Cocineros en tu comunidad
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-olive-soft">
            Conectá con personas reales que preparan comida con amor y dedicación.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.id} href={`/categorias/${category.id}`} className="group">
                <div className="flex flex-col rounded-2xl border border-border bg-white p-10 shadow-sm-custom transition-all duration-300 hover:-translate-y-2 hover:shadow-md-custom">
                  {/* Icon */}
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-cream-light text-tomato shadow-sm-custom">
                    <Icon className="h-7 w-7" />
                  </div>

                  {/* Content */}
                  <span className="text-sm font-semibold uppercase tracking-wide text-olive-soft">
                    {category.subtitle}
                  </span>

                  <h3 className="mt-2 font-[Poppins] text-2xl font-bold text-dark-graphite">
                    {category.title}
                  </h3>

                  <p className="mt-3 text-sm text-muted">{category.description}</p>

                  {/* Decorative line */}
                  <div className="mt-6 h-1 w-0 rounded-full bg-tomato transition-all duration-300 group-hover:w-14"></div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}




