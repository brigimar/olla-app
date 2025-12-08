'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HeroSection() {
  const [i, setI] = useState(0);

  const placeholders = [
    '¿Qué querés comer hoy? Guisos, empanadas, comidas regionales...',
    'Explorá comida casera cerca tuyo',
    'Encontrá cocineros de tu barrio',
  ];

  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % placeholders.length), 4000);
    return () => clearInterval(id);
  }, [placeholders.length]); // ✅ dependencia añadida

  return (
    <section
      className="
        relative flex h-[80vh] min-h-[580px]
        w-full items-center justify-center overflow-hidden text-center
      "
      style={{
        backgroundImage: `
          linear-gradient(
            to bottom,
            rgba(255,244,233,0.92) 0%,
            rgba(255,244,233,0.70) 40%,
            rgba(255,244,233,0.55) 70%,
            rgba(255,244,233,0.35) 100%
          ),
          url('/hero.webp')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundBlendMode: 'screen',
      }}
    >
      <div className="relative z-10 mx-auto max-w-3xl px-6">
        <h1 className="font-[Poppins] text-5xl font-bold leading-tight text-dark-graphite drop-shadow-sm md:text-6xl">
          Comida casera de tu barrio,
          <br /> directo a tu mesa
        </h1>

        <p className="max-w-2xl text-lg font-semibold text-olive-soft sm:text-xl">
          {placeholders[i]} {/* ✅ ahora usamos el índice para mostrar texto dinámico */}
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/explorar"
            className="rounded-full bg-tomato px-8 py-4 text-lg font-semibold text-white shadow-md-custom transition hover:bg-tomato-light"
          >
            📍 Explorar platos cerca de mí
          </Link>

          <Link
            href="/ser-cocinero"
            className="rounded-full border border-white/40 bg-white/70 px-8 py-4 text-lg font-medium text-dark-graphite backdrop-blur-sm transition hover:bg-white hover:text-dark-graphite"
          >
            👩‍🍳 Convertirme en cocinero
          </Link>
        </div>
      </div>
    </section>
  );
}



