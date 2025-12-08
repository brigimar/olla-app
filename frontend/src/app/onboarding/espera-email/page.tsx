'use client';

export default function EsperaEmailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-blue-50">
      <div className="mx-4 max-w-md text-center">
        <h1 className="mb-4 text-3xl font-bold text-blue-700">📧 Revisá tu bandeja de entrada</h1>
        <p className="mb-6 text-gray-700">
          Te enviamos un correo de confirmación. Hacé clic en el enlace para activar tu cuenta y
          continuar con el onboarding.
        </p>
        <p className="text-sm text-gray-500">
          Si no lo encontrás, revisá la carpeta de <strong>Spam</strong> o <strong>Promociones</strong>.
        </p>
      </div>
    </div>
  );
}
