'use client';

export default function EsperaEmailPage() {
  return (
    <div className="mx-auto max-w-md rounded bg-white p-6 shadow">
      <h1 className="mb-4 text-xl font-bold">Revisá tu correo 📧</h1>

      <div className="space-y-4 text-gray-700">
        <p>
          Te enviamos un email de confirmación a la dirección que registraste. 
          Hacé clic en el enlace que aparece en ese correo para activar tu cuenta.
        </p>

        <p>
          Una vez confirmada, te vamos a redirigir automáticamente a la siguiente etapa del onboarding.
        </p>

        <p className="text-sm text-gray-500">
          Si no encontrás el correo, revisá tu carpeta de spam o intentá registrarte nuevamente con la misma dirección.
        </p>
      </div>
    </div>
  );
}
