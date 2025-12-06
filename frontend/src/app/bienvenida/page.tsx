// frontend/src/app/bienvenida/page.tsx
'use client';

import Link from 'next/link';

export default function BienvenidaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-100">
      <div className="mx-auto max-w-lg rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-center text-3xl font-extrabold text-orange-600 mb-4">
          🎉 ¡Bienvenido a OllaApp!
        </h1>
        <p className="text-center text-gray-700 mb-8">
          Tu email fue verificado con éxito. Ahora completá tu perfil de negocio y subí tu primer plato para empezar a vender.
        </p>

        <div className="space-y-4">
          <Link
            href="/registro/cocinero"
            className="block w-full rounded-lg bg-orange-500 px-4 py-3 text-center text-white font-semibold shadow hover:bg-orange-600 transition-colors"
          >
            Completar datos del negocio
          </Link>

          <Link
            href="/platos/nuevo"
            className="block w-full rounded-lg bg-green-500 px-4 py-3 text-center text-white font-semibold shadow hover:bg-green-600 transition-colors"
          >
            Subir tu primer plato
          </Link>
        </div>
      </div>
    </div>
  );
}
