"use client";

import Link from "next/link";
import { Users, ChefHat, Sparkles } from "lucide-react";
import React from "react";

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
      id: "families",
      title: "Familias",
      subtitle: "Familias cocinando",
      description: "Recetas multigeneracionales con tradición y sabor.",
      icon: Users,
    },
    {
      id: "specialists",
      title: "Cocineros Expertos",
      subtitle: "Especialistas",
      description: "Platos auténticos y elaborados con técnica profesional.",
      icon: ChefHat,
    },
    {
      id: "emergent",
      title: "Nuevas Voces",
      subtitle: "Chefs emergentes",
      description: "Innovación y creatividad desde la cocina casera.",
      icon: Sparkles,
    },
  ];

  return (
    <section className="w-full py-24 bg-white">
      <div className="w-full max-w-[1600px] mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-[Poppins] font-bold text-dark-graphite">
            Cocineros en tu comunidad
          </h2>
          <p className="mt-4 text-lg text-olive-soft max-w-2xl mx-auto">
            Conectá con personas reales que preparan comida con amor y dedicación.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                href={`/categorias/${category.id}`}
                className="group"
              >
                <div className="bg-white border border-border rounded-2xl p-10 shadow-sm-custom hover:shadow-md-custom transition-all duration-300 hover:-translate-y-2 flex flex-col">
                  
                  {/* Icon */}
                  <div className="h-14 w-14 flex items-center justify-center rounded-full bg-cream-light text-tomato mb-6 shadow-sm-custom">
                    <Icon className="h-7 w-7" />
                  </div>

                  {/* Content */}
                  <span className="text-sm font-semibold uppercase tracking-wide text-olive-soft">
                    {category.subtitle}
                  </span>

                  <h3 className="mt-2 text-2xl font-[Poppins] font-bold text-dark-graphite">
                    {category.title}
                  </h3>

                  <p className="mt-3 text-muted text-sm">
                    {category.description}
                  </p>

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
