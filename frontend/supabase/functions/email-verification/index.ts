// supabase/functions/email-verification/index.ts
import "jsr:@supabase/functions-js/edge-runtime";
import { createClient } from "jsr:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // clave con permisos
);

export default async function handler(req: Request): Promise<Response> {
  // Escucha notificaciones de Postgres
  const { body } = await req.json();
  const email = body?.payload;

  if (!email) {
    return new Response("No email provided", { status: 400 });
  }

  // Aquí podrías usar un servicio externo (SendGrid, Resend, Postmark, etc.)
  // Ejemplo simple con Resend API:
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return new Response("Missing RESEND_API_KEY", { status: 500 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "noreply@tusitio.com",
      to: email,
      subject: "Verifica tu correo",
      html: `<p>Hola 👋, por favor verifica tu correo haciendo clic en el enlace:</p>
             <p><a href="https://tusitio.com/verificar?email=${encodeURIComponent(email)}">Verificar correo</a></p>`,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return new Response(`Error sending email: ${errText}`, { status: 500 });
  }

  return new Response("Verification email sent", { status: 200 });
}
