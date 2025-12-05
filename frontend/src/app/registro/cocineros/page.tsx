'use client';
import FormCocinero from '@/components/forms/FormCocinero';

export default function CocinerosPage() {
  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Registro de Cocineros</h1>
      <p className="mb-4 text-gray-600">
        Completa el formulario para registrarte como cocinero en la plataforma.
      </p>
      <FormCocinero />
    </main>
  );
}
