'use client';

import React from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Twitter, MessageCircle, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-dark-graphite text-cream-light">
      {/* Sección principal */}
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-12 px-6 py-16 md:grid-cols-4">
        {/* Marca */}
        <div>
          <h3 className="mb-4 font-[Poppins] text-2xl font-bold text-white">OllaApp</h3>
          <p className="text-sm leading-relaxed text-cream-light/80">
            El marketplace de comidas caseras que conecta cocineros talentosos con vecinos que
            buscan autenticidad en CABA y AMBA.
          </p>

          <div className="mt-6 flex gap-4 text-gold-accent">
            <Instagram className="h-5 w-5 transition hover:text-white" />
            <Facebook className="h-5 w-5 transition hover:text-white" />
            <Twitter className="h-5 w-5 transition hover:text-white" />
            <MessageCircle className="h-5 w-5 transition hover:text-white" />
          </div>
        </div>

        {/* Para compradores */}
        <div>
          <h4 className="mb-4 font-[Poppins] text-lg font-semibold text-white">Para compradores</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="#" className="transition hover:text-gold-accent">
                Cómo comprar
              </Link>
            </li>
            <li>
              <Link href="#" className="transition hover:text-gold-accent">
                Cocineros cerca tuyo
              </Link>
            </li>
            <li>
              <Link href="#" className="transition hover:text-gold-accent">
                Comidas regionales
              </Link>
            </li>
            <li>
              <Link href="#" className="transition hover:text-gold-accent">
                Seguridad y confianza
              </Link>
            </li>
          </ul>
        </div>

        {/* Para cocineros */}
        <div>
          <h4 className="mb-4 font-[Poppins] text-lg font-semibold text-white">Para cocineros</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="#" className="transition hover:text-gold-accent">
                Vendé tu comida
              </Link>
            </li>
            <li>
              <Link href="#" className="transition hover:text-gold-accent">
                Requisitos
              </Link>
            </li>
            <li>
              <Link href="#" className="transition hover:text-gold-accent">
                Herramientas
              </Link>
            </li>
            <li>
              <Link href="#" className="transition hover:text-gold-accent">
                Soporte
              </Link>
            </li>
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h4 className="mb-4 font-[Poppins] text-lg font-semibold text-white">Contacto</h4>
          <ul className="space-y-2 text-sm">
            <li>
              Email:{' '}
              <a href="mailto:hola@ollaapp.com.ar" className="transition hover:text-gold-accent">
                hola@ollaapp.com.ar
              </a>
            </li>
            <li>Teléfono: +54 11 1234-5678</li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold-accent" />
              Buenos Aires, Argentina
            </li>
          </ul>
        </div>
      </div>

      {/* CTA destacado */}
      <div className="border-t border-white/10 py-8 text-center">
        <button className="rounded-full bg-cream-light px-10 py-4 text-sm font-semibold text-dark-graphite shadow-md transition hover:bg-white">
          📍 Ubicación actual • Reservar ahora
        </button>
      </div>

      {/* Copyright */}
      <div className="py-6 text-center text-xs text-cream-light/60">
        © 2025 OllaApp — Todos los derechos reservados — Buenos Aires, Argentina.
      </div>
    </footer>
  );
}
