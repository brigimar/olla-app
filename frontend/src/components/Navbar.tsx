"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import React, { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-transparent backdrop-blur-[2px]">
      <div className="w-full max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-dark-graphite font-[Poppins] tracking-tight">
          OllaApp
        </Link>

        {/* Search (desktop) */}
        <div className="hidden md:block w-1/2 relative">
          <input
            type="text"
            placeholder="Buscar comidas caseras…"
            className="w-full rounded-full bg-white border border-border px-10 py-3 text-sm shadow-sm-custom focus:ring-2 focus:ring-tomato/30 focus:border-tomato"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted h-5 w-5" />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/cocineros"
            className="px-5 py-2 rounded-full border border-border text-dark-graphite text-sm font-medium hover:bg-white transition"
          >
            Cocinero
          </Link>

          <Link
            href="/explorar"
            className="px-6 py-2 rounded-full bg-tomato text-white text-sm font-semibold shadow-md-custom hover:bg-tomato-light transition"
          >
            🧭 Explorar
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className="px-5 py-2 rounded-full bg-cream-light border border-border text-dark-graphite text-sm font-medium hover:bg-white transition"
          >
            🛒 Carrito
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute right-6 top-20 w-80 bg-white rounded-xl border border-border shadow-lg-custom p-5">
          <p className="text-dark-graphite text-sm">Tu carrito está vacío</p>
        </div>
      )}
    </header>
  );
}
