'use client';

import Link from 'next/link';
import { CheckCircle, Package, Zap } from 'lucide-react';

export default function PequenoNegocio() {
  return (
    <section className="w-full bg-warm-cream py-20">
      <div className="container grid grid-cols-1 items-center gap-12 md:grid-cols-2">
        {/* Imagen del chef (puede ser ilustración o foto) */}
        <div className="h-[300px] w-full rounded-2xl bg-[url('/images/chef.jpg')] bg-cover bg-center shadow-md-custom md:h-[400px]" />

        {/* Texto promocional */}
        <div className="flex flex-col justify-center">
          <h2 className="mb-6 font-[Poppins] text-3xl font-bold text-dark-graphite md:text-4xl">
            Convertí tu cocina en un pequeño negocio
          </h2>
          <p className="mb-8 text-lg text-muted">
            Vende tus platos caseros en OllaApp y gana dinero extra. Miles de vecinos están buscando
            comida como la tuya.
          </p>

          <ul className="mb-8 space-y-4">
            <li className="flex items-start gap-3 text-dark-graphite">
              <CheckCircle className="mt-1 h-6 w-6 text-accent" />
              <span>
                <strong>Sin experiencia necesaria</strong>
                <br />
                Vende lo que ya sabes hacer
              </span>
            </li>
            <li className="flex items-start gap-3 text-dark-graphite">
              <Package className="mt-1 h-6 w-6 text-accent2" />
              <span>
                <strong>Gestiona tu tiempo</strong>
                <br />
                Elige los horarios que mejor te convengan
              </span>
            </li>
            <li className="flex items-start gap-3 text-dark-graphite">
              <Zap className="mt-1 h-6 w-6 text-accent3" />
              <span>
                <strong>Gana dinero rápido</strong>
                <br />
                Cobra semanalmente sin comisiones ocultas
              </span>
            </li>
          </ul>

          <Link
            href="/ser-cocinero"
            className="btn btn-primary w-fit rounded-full px-6 py-3 text-lg text-white"
          >
            Comenzá a vender
          </Link>
        </div>
      </div>
    </section>
  );
}



