import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const type = url.searchParams.get("type") || "signup";
    const next = url.searchParams.get("next") || "https://olla-app.vercel.app/onboarding/success";

    if (!token) {
      return new Response("Missing token", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("PROJECT_URL")!,        // 👈 usar PROJECT_URL
      Deno.env.get("SERVICE_ROLE_KEY")!    // 👈 usar SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase.auth.verifyOtp({
      type: type as "signup" | "magiclink" | "recovery" | "email_change",
      token
    });

    if (error) {
      console.error("Error verifying token:", error.message);
      const errUrl = new URL("https://olla-app.vercel.app/onboarding/error");
      errUrl.searchParams.set("reason", "invalid_or_expired_token");
      return Response.redirect(errUrl.toString(), 302);
    }

    // Opcional: auditar confirmación
    // await supabase.from("audit_confirmations").insert({ user_id: data.user.id, at: new Date().toISOString() });

    return Response.redirect(next, 302);
  } catch (e) {
    console.error("Unhandled error:", e);
    return new Response("Internal error", { status: 500 });
  }
});
