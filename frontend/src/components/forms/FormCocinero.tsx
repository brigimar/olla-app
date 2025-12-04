'use client';
//FormCocinero.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // 👈 usa el cliente centralizado

export default function ProducerRegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Crear cuenta en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      const user = authData.user;
      if (!user) throw new Error('No se pudo registrar el usuario.');

      let logoUrl: string | null = null;

      // 2. Subir logo al bucket "producers"
      if (file) {
        const fileName = `${user.id}-${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('producers')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('producers').getPublicUrl(fileName);
        logoUrl = data.publicUrl;
      }

      // 3. Insertar productor en la tabla "producers"
      const { error: insertError } = await supabase.from('producers').insert([
        {
          id: user.id,
          business_name: businessName,
          description,
          address,
          address_point: null,
          delivery_zone_id: null,
          is_active: true,
          rating: 0.0,
          total_orders: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          logo_url: logoUrl,
        },
      ]);

      if (insertError) throw insertError;

      alert('✅ Productor registrado con éxito!');
      setEmail('');
      setPassword('');
      setBusinessName('');
      setDescription('');
      setAddress('');
      setFile(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('❌ Error registrando productor: ' + err.message);
      } else {
        alert('❌ Error desconocido registrando productor');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleRegister}
      className="mx-auto max-w-md space-y-4 rounded bg-white p-6 shadow"
    >
      <h2 className="text-center text-2xl font-bold">Registro de Productor</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded border p-2"
        required
      />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded border p-2"
        required
      />

      <input
        type="text"
        placeholder="Nombre del negocio"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        className="w-full rounded border p-2"
        required
      />

      <textarea
        placeholder="Descripción del negocio"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded border p-2"
      />

      <input
        type="text"
        placeholder="Dirección"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full rounded border p-2"
        required
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="w-full rounded border p-2"
      />

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? 'Registrando...' : 'Registrar Productor'}
      </button>
    </form>
  );
}
