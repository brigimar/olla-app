// frontend/src/app/api/cleanup/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ⚠️ Usa la service_role key, nunca la expongas en el cliente
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    // ✅ usamos unknown en vez de any
    const message = err instanceof Error ? err.message : 'Error desconocido en cleanup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
