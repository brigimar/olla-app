// src/app/debug/page.tsx
"use client";

export default function DebugPage() {
  return (
    <div>
      <h1>Debug de Variables de Entorno</h1>
      <pre>
        {JSON.stringify({
          NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '***' : undefined,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***' : undefined,
          NODE_ENV: process.env.NODE_ENV,
        }, null, 2)}
      </pre>
    </div>
  );
}
