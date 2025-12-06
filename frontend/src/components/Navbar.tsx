'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import React, { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed left-0 top-0 z-50 w-full bg-transparent backdrop-blur-[2px]">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="font-[Poppins] text-2xl font-bold tracking-tight text-dark-graphite"
        >
          OllaApp
        </Link>

        {/* Search (desktop) */}
        <div className="relative hidden w-1/2 md:block">
          <input
            type="text"
            placeholder="Buscar comidas caseras…"
            className="w-full rounded-full border border-border bg-white px-10 py-3 text-sm shadow-sm-custom focus:border-tomato focus:ring-2 focus:ring-tomato/30"
          />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/cocineros"
            className="rounded-full border border-border px-5 py-2 text-sm font-medium text-dark-graphite transition hover:bg-white"
          >
            Cocinero
          </Link>

          <Link
            href="/explorar"
            className="rounded-full bg-tomato px-6 py-2 text-sm font-semibold text-white shadow-md-custom transition hover:bg-tomato-light"
          >
            🧭 Explorar
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className="rounded-full border border-border bg-cream-light px-5 py-2 text-sm font-medium text-dark-graphite transition hover:bg-white"
          >
            🛒 Carrito
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute right-6 top-20 w-80 rounded-xl border border-border bg-white p-5 shadow-lg-custom">
          <p className="text-sm text-dark-graphite">Tu carrito está vacío</p>
        </div>
      )}
    </header>
  );
}
