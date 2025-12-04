"use client";

import React from "react";
import Link from "next/link";
import {
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  MapPin,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-dark-graphite text-cream-light">
      
      {/* Sección principal */}
      <div className="w-full max-w-[1600px] mx-auto px-6 py-16 grid grid-cols-1 gap-12 md:grid-cols-4">

        {/* Marca */}
        <div>
          <h3 className="text-2xl font-bold font-[Poppins] text-white mb-4">
            OllaApp
          </h3>
          <p className="text-sm leading-relaxed text-cream-light/80">
            El marketplace de comidas caseras que conecta cocineros talentosos
            con vecinos que buscan autenticidad en CABA y AMBA.
          </p>

          <div className="mt-6 flex gap-4 text-gold-accent">
            <Instagram className="h-5 w-5 hover:text-white transition" />
            <Facebook className="h-5 w-5 hover:text-white transition" />
            <Twitter className="h-5 w-5 hover:text-white transition" />
            <MessageCircle className="h-5 w-5 hover:text-white transition" />
          </div>
        </div>

        {/* Para compradores */}
        <div>
          <h4 className="text-lg font-semibold font-[Poppins] text-white mb-4">
            Para compradores
          </h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="#" className="hover:text-gold-accent transition">Cómo comprar</Link></li>
            <li><Link href="#" className="hover:text-gold-accent transition">Cocineros cerca tuyo</Link></li>
            <li><Link href="#" className="hover:text-gold-accent transition">Comidas regionales</Link></li>
            <li><Link href="#" className="hover:text-gold-accent transition">Seguridad y confianza</Link></li>
          </ul>
        </div>

        {/* Para cocineros */}
        <div>
          <h4 className="text-lg font-semibold font-[Poppins] text-white mb-4">
            Para cocineros
          </h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="#" className="hover:text-gold-accent transition">Vendé tu comida</Link></li>
            <li><Link href="#" className="hover:text-gold-accent transition">Requisitos</Link></li>
            <li><Link href="#" className="hover:text-gold-accent transition">Herramientas</Link></li>
            <li><Link href="#" className="hover:text-gold-accent transition">Soporte</Link></li>
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h4 className="text-lg font-semibold font-[Poppins] text-white mb-4">
            Contacto
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              Email:{" "}
              <a
                href="mailto:hola@ollaapp.com.ar"
                className="hover:text-gold-accent transition"
              >
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
        <button className="bg-cream-light text-dark-graphite px-10 py-4 rounded-full text-sm font-semibold shadow-md hover:bg-white transition">
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
