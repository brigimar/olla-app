"use client";

import Link from "next/link";
import { CheckCircle, Package, Zap } from "lucide-react";

export default function PequenoNegocio() {
  return (
    <section className="w-full bg-warm-cream py-20">
      <div className="container grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Imagen del chef (puede ser ilustración o foto) */}
        <div className="w-full h-[300px] md:h-[400px] rounded-2xl bg-[url('/images/chef.jpg')] bg-cover bg-center shadow-md-custom" />

        {/* Texto promocional */}
        <div className="flex flex-col justify-center">
          <h2 className="text-3xl md:text-4xl font-[Poppins] font-bold text-dark-graphite mb-6">
            Convertí tu cocina en un pequeño negocio
          </h2>
          <p className="text-lg text-muted mb-8">
            Vende tus platos caseros en OllaApp y gana dinero extra. Miles de vecinos están buscando comida como la tuya.
          </p>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3 text-dark-graphite">
              <CheckCircle className="text-accent w-6 h-6 mt-1" />
              <span><strong>Sin experiencia necesaria</strong><br />Vende lo que ya sabes hacer</span>
            </li>
            <li className="flex items-start gap-3 text-dark-graphite">
              <Package className="text-accent2 w-6 h-6 mt-1" />
              <span><strong>Gestiona tu tiempo</strong><br />Elige los horarios que mejor te convengan</span>
            </li>
            <li className="flex items-start gap-3 text-dark-graphite">
              <Zap className="text-accent3 w-6 h-6 mt-1" />
              <span><strong>Gana dinero rápido</strong><br />Cobra semanalmente sin comisiones ocultas</span>
            </li>
          </ul>

          <Link href="/ser-cocinero" className="btn btn-primary px-6 py-3 rounded-full text-white text-lg w-fit">
            Comenzá a vender
          </Link>
        </div>
      </div>
    </section>
  );
}
