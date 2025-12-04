"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

// Importa estilos de Swiper en tu globals.css
// @import 'swiper/css';
// @import 'swiper/css/pagination';
// @import 'swiper/css/autoplay';

export default function CategoriasCocina() {
  const categories = [
    { name: "Peruana", image: "/images/peruana.webp" },
    { name: "Boliviana", image: "/images/boliviana.webp" },
    { name: "Paraguaya", image: "/images/paraguaya.webp" },
    { name: "Criolla", image: "/images/criolla.webp" },
    { name: "Provincial", image: "/images/provincial.webp" },
    { name: "Andina", image: "/images/santiaguena.webp" },
  ];

  return (
    <section className="w-full py-20 bg-warm-cream">
      <div className="w-full max-w-[1600px] mx-auto px-6">
        <h2 className="section-title text-center">
          Cocina de nuestras comunidades
        </h2>

        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          loop={true}
          spaceBetween={24}
          breakpoints={{
            0: { slidesPerView: 1 },     // Mobile
            640: { slidesPerView: 2 },   // Tablet
            1024: { slidesPerView: 3 },  // Desktop
          }}
          className="mt-12"
        >
          {categories.map((cat, idx) => (
            <SwiperSlide key={idx}>
              <div
                className="h-[220px] rounded-2xl shadow-md-custom flex items-center justify-center text-white text-xl font-[Poppins] text-center hover:opacity-90 transition relative"
                style={{
                  backgroundImage: `url(${cat.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Overlay para legibilidad */}
                <div className="absolute inset-0 bg-black/40 rounded-2xl"></div>
                <span className="relative z-10">{cat.name}</span>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
