"use client";

import { Lightbulb, ShoppingCart, Truck } from "lucide-react";

export default function ComoFunciona() {
  const steps = [
    {
      icon: Lightbulb,
      title: "Descubrí cocineros cerca",
      desc: "Explorá perfiles con fotos reales y menús actualizados.",
    },
    {
      icon: ShoppingCart,
      title: "Reservá tu plato",
      desc: "Elegí lo que querés comer y seleccioná horario.",
    },
    {
      icon: Truck,
      title: "Retirá o recibí tu pedido",
      desc: "Coordiná retiro o entrega cerca tuyo.",
    },
  ];

  return (
    <section className="w-full py-20 bg-warm-cream">
      <div className="container">
        <h2 className="text-center text-3xl md:text-4xl font-[Poppins] font-bold text-dark-graphite">
          Cómo funciona
        </h2>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="bg-card border border-border rounded-2xl p-10 shadow-card hover:shadow-md-custom transition"
              >
                <div className="h-14 w-14 flex items-center justify-center rounded-full bg-tomato text-white mx-auto mb-6">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-dark-graphite text-center font-[Poppins]">
                  {s.title}
                </h3>
                <p className="text-sm text-muted mt-2 text-center">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
