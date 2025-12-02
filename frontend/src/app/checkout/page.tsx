'use client';
import dynamic from 'next/dynamic';

export default function CheckoutPage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold">Checkout</h2>
      <CheckoutForm />
    </div>
  );
}
