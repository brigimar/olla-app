// app/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getServerSupabase } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const cookieStore = cookies();
  
  // 1. Verificar autenticación
  let user;
  try {
    user = await requireAuth(cookieStore);
  } catch {
    redirect('/login');
  }

  // 2. Obtener datos del productor
  const supabase = getServerSupabase(cookieStore);
  const { data: producer, error } = await supabase
    .from('producers')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !producer) {
    // Puedes redirigir o mostrar mensaje
    redirect('/onboarding/completar-perfil');
  }

  // 3. Pasar datos al cliente
  return <DashboardClient producer={producer} />;
}
