'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProducerSignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);

    const { error } = await supabase.auth.signUp({ email, password }); // ✅ eliminamos data

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    // Nota: si tu proyecto tiene verificación por email activada,
    // Supabase enviará un correo de confirmación.
    setMsg('Registro iniciado. Revisa tu email para confirmar la cuenta (si corresponde).');
  }

  return (
    <form onSubmit={handleSignUp} className="max-w-sm space-y-4">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-green-600 py-2 text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Registrando...' : 'Crear productor'}
      </button>

      {msg && <p className="text-sm text-green-600">{msg}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </form>
  );
}
