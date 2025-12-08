'use client';

import { Lightbulb, ShoppingCart, Truck } from 'lucide-react';

export default function ComoFunciona() {
  const steps = [
    {
      icon: Lightbulb,
      title: 'Descubrí cocineros cerca',
      desc: 'Explorá perfiles con fotos reales y menús actualizados.',
    },
    {
      icon: ShoppingCart,
      title: 'Reservá tu plato',
      desc: 'Elegí lo que querés comer y seleccioná horario.',
    },
    {
      icon: Truck,
      title: 'Retirá o recibí tu pedido',
      desc: 'Coordiná retiro o entrega cerca tuyo.',
    },
  ];

  return (
    <section className="w-full bg-warm-cream py-20">
      <div className="container">
        <h2 className="text-center font-[Poppins] text-3xl font-bold text-dark-graphite md:text-4xl">
          Cómo funciona
        </h2>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-10 shadow-card transition hover:shadow-md-custom"
              >
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-tomato text-white">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-center font-[Poppins] text-lg font-semibold text-dark-graphite">
                  {s.title}
                </h3>
                <p className="mt-2 text-center text-sm text-muted">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}



