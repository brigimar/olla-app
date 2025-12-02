"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import Cart from "@/components/Cart";
import Checkout from "@/components/Checkout";

export default function Navbar() {
  const { items } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white shadow px-4 py-3 flex justify-between items-center">
      <h1 className="font-bold text-xl">OLLA APP</h1>

      {/* Carrito con dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="relative p-2 rounded hover:bg-gray-100"
        >
          🛒
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2">
              {items.length}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg p-4 z-50">
            <Cart />
            <div className="mt-4 border-t pt-4">
              <Checkout />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
