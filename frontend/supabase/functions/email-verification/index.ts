import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const type = url.searchParams.get("type") || "signup";

  if (!token) {
    return new Response("Missing token", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("PROJECT_URL")!,        // usar PROJECT_URL
    Deno.env.get("SERVICE_ROLE_KEY")!    // usar SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase.auth.verifyOtp({
    type: type as "signup" | "magiclink",
    token
  });

  if (error) {
    return new Response("Invalid or expired token", { status: 400 });
  }

  // Redirigir al onboarding éxito
  return Response.redirect("http://localhost:3000/onboarding/success", 302);
});
