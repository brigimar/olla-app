// src/app/env-debug/page.tsx
"use client";

export default function EnvDebug() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>🔍 Diagnóstico de Variables</h1>
      <pre>
        {JSON.stringify(
          {
            NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          },
          null,
          2
        )}
      </pre>
    </div>
  );
}