import FormCocineroBreve from '@/components/forms/FormCocineroBreve';

export default function CocinerosPage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Registro de Cocineros</h1>
      <p className="mb-4 text-gray-600">
        Completa el formulario para registrarte como cocinero en la plataforma.
      </p>
      <FormCocineroBreve />
    </main>
  );
}
