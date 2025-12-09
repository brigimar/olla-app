'use client';

import { useRouter } from "next/navigation";

export default function Success() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-green-50">
      <div className="mx-4 max-w-md text-center">
        <h1 className="mb-4 text-3xl font-bold text-green-700">✅ Cuenta confirmada</h1>
        <p className="mb-6 text-gray-700">
          Tu correo fue verificado correctamente. Ya podés continuar con el onboarding.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
        >
          Ir al Dashboard
        </button>
      </div>
    </div>
  );
}




