import { useRouter } from "next/router";

export default function ErrorPage() {
  const router = useRouter();
  const { reason } = router.query;

  const messages: Record<string, string> = {
    missing_code: "Falta el código de verificación.",
    invalid_or_expired_token: "El enlace de confirmación es inválido o expiró.",
    auth_failed: "No se pudo crear la sesión.",
    default: "Ocurrió un error al confirmar tu cuenta."
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-red-50">
      <div className="mx-4 max-w-md text-center">
        <h1 className="mb-4 text-3xl font-bold text-red-700">❌ Error en la confirmación</h1>
        <p className="mb-6 text-gray-700">
          {messages[reason as string] || messages.default}
        </p>
        <a
          href="/signup"
          className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
        >
          Volver a registrarme
        </a>
      </div>
    </div>
  );
}
