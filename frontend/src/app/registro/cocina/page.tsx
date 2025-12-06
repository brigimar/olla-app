import FormCocinero from '@/components/forms/FormCocinero';

export default function CocinaPage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Registro de tu Cocina</h1>
      <p className="mb-4 text-gray-600">
        Completa el formulario para registrar tu cocina en la plataforma.
      </p>
      <FormCocinero />
    </main>
  );
}
