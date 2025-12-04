"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

export default function HeroSection() {
  const [query, setQuery] = useState("");
  const [i, setI] = useState(0);

  const placeholders = [
    "¿Qué querés comer hoy? Guisos, empanadas, comidas regionales...",
    "Explorá comida casera cerca tuyo",
    "Encontrá cocineros de tu barrio",
  ];

  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % placeholders.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="
        relative w-full h-[80vh] min-h-[580px]
        flex items-center justify-center text-center overflow-hidden
      "
      style={{
        /* 1) Tu imagen local en /public */
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
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundBlendMode: "screen",
        //✔ Más suave → soft-light (actual)
        //Más desenfoque visual → overlay
        //Imagen más visible → normal
        //Más lavado → screen
        //Más oscuro → multiply
      }}
    >
      {/* Contenido */}
      <div className="relative z-10 mx-auto max-w-3xl px-6">

        <h1 className="text-5xl md:text-6xl font-[Poppins] font-bold text-dark-graphite leading-tight drop-shadow-sm">
          Comida casera de tu barrio,
          <br /> directo a tu mesa
        </h1>

        <p className="text-olive-soft text-lg sm:text-xl max-w-2xl font-semibold">
  Comprá a cocineros de tu zona: abuelas, familias, emprendedores y cocinas artesanales del AMBA y CABA.
</p>


        {/* Botones */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/explorar"
            className="px-8 py-4 rounded-full bg-tomato text-white text-lg font-semibold shadow-md-custom hover:bg-tomato-light transition"
          >
            📍 Explorar platos cerca de mí
          </Link>

          <Link
            href="/ser-cocinero"
            className="px-8 py-4 rounded-full bg-white/70 backdrop-blur-sm border border-white/40 text-dark-graphite text-lg font-medium hover:bg-white hover:text-dark-graphite transition"
          >
            👩‍🍳 Convertirme en cocinero
          </Link>
        </div>

                {/* Tercera acción */}
      
      </div>
    </section>
    
  );
}
