// middleware/withAuth.ts - UTILIDAD REUTILIZABLE
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function requireAuth(
  request: NextRequest,
  handler: (user: any, supabase: any) => Promise<Response>
) {
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  // Verificar token explícitamente
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  
  return handler(user, supabase);
}

// Uso en route handler:
// app/api/producers/self/route.ts
import { requireAuth } from '@/middleware/withAuth';

export async function GET(request: NextRequest) {
  return requireAuth(request, async (user, supabase) => {
    const { data, error } = await supabase
      .from('producers')
      .select('*')
      .eq('id', user.id) // ✅ Garantizado por auth
      .single();
      
    return NextResponse.json(data || null);
  });
}