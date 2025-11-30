###########################################################################
# RECONSTRUCCIÓN COMPLETA DEL FRONTEND – NEXT.JS (APP ROUTER)
###########################################################################

Write-Host "🚀 Iniciando reconstrucción del frontend..." -ForegroundColor Cyan

$base = "frontend/src"

# ================================================================
# 1) CREAR ESTRUCTURA BASE
# ================================================================

Write-Host "📁 Reorganizando carpetas base..." -ForegroundColor Yellow

$folders = @(
    "$base/app",
    "$base/components",
    "$base/features",
    "$base/hooks",
    "$base/lib",
    "$base/styles",
    "$base/utils"
)

foreach ($f in $folders) {
    if (-Not (Test-Path $f)) {
        New-Item -ItemType Directory -Path $f | Out-Null
        Write-Host "  ➕ $f" -ForegroundColor Green
    } else {
        Write-Host "  ✔ Ya existe: $f" -ForegroundColor DarkGray
    }
}

# ================================================================
# 2) REORDENAR EL APP ROUTER AUTOMÁTICAMENTE
# ================================================================

Write-Host "🧭 Reordenando App Router (src/app)..." -ForegroundColor Yellow

$appDir = "$base/app"

# Crear páginas base si no existen
$pages = @(
    "layout.tsx",
    "page.tsx",
    "(public)/info/page.tsx",
    "(public)/about/page.tsx",
    "(public)/contact/page.tsx"
)

foreach ($p in $pages) {
    $fullPath = Join-Path $appDir $p
    $dir = Split-Path $fullPath

    if (-Not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

    if (-Not (Test-Path $fullPath)) {
@"
export default function Page() {
  return <div>🚀 Nueva página generada automáticamente</div>;
}
"@ | Set-Content $fullPath
        Write-Host "  ➕ Creado: $p" -ForegroundColor Green
    } else {
        Write-Host "  ✔ Ya existe: $p" -ForegroundColor DarkGray
    }
}

# ================================================================
# 3) REUBICAR PÁGINAS PERDIDAS / HUÉRFANAS
# ================================================================

Write-Host "🔍 Buscando páginas huérfanas en src..." -ForegroundColor Yellow

$orphans = Get-ChildItem -Recurse "$base" -Include "page.tsx" | Where-Object {
    $_.DirectoryName -notlike "*app*"
}

foreach ($file in $orphans) {
    $dest = "$appDir/huérfanas/$($file.Directory.Name)"
    if (-Not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }

    Move-Item $file.FullName "$dest/page.tsx" -Force
    Write-Host "  🔄 Movido: $($file.FullName) → $dest" -ForegroundColor Green
}

# ================================================================
# 4) RECONSTRUIR ARCHIVOS BASE (TypeScript scaffolding)
# ================================================================

Write-Host "🧱 Regenerando archivos base TS..." -ForegroundColor Yellow

# frontend/src/lib/api.ts
$apiFile = "$base/lib/api.ts"
@"
export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL}\${path}\`, {
    ...options,
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}
"@ | Set-Content $apiFile

# frontend/src/lib/supabase.ts
$supaFile = "$base/lib/supabase.ts"
@"
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
"@ | Set-Content $supaFile

# frontend/src/utils/helpers.ts
$helpersFile = "$base/utils/helpers.ts"
@"
export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
"@ | Set-Content $helpersFile

Write-Host "  ✔ Archivos base regenerados" -ForegroundColor Green

# ================================================================
# 5) PLACEHOLDERS PARA FEATURES, HOOKS, STYLES
# ================================================================

Write-Host "📌 Generando scaffolding..." -ForegroundColor Yellow

# features/example
@"
export default function ExampleFeature() {
  return <div>🧩 Feature placeholder</div>;
}
"@ | Set-Content "$base/features/example.tsx"

# hooks/useExample.ts
@"
import { useState } from 'react';

export function useExample() {
  const [value, setValue] = useState(0);
  return { value, setValue };
}
"@ | Set-Content "$base/hooks/useExample.ts"

# styles/global.css
if (-Not (Test-Path "$base/styles/global.css")) {
@"
:root {
  --primary: #4f46e5;
}
body {
  margin: 0;
  font-family: system-ui;
}
"@ | Set-Content "$base/styles/global.css"
}

Write-Host "  ✔ Placeholders generados" -ForegroundColor Green

# ================================================================
# 6) MENSAJE FINAL
# ================================================================

Write-Host "`n🎉 FRONTEND RECONSTRUIDO COMPLETAMENTE" -ForegroundColor Cyan
Write-Host "✔ Carpetas limpias" -ForegroundColor Cyan
Write-Host "✔ App Router organizado" -ForegroundColor Cyan
Write-Host "✔ Scaffolding TS regenerado" -ForegroundColor Cyan
Write-Host "✔ Estructura moderna lista para seguir" -ForegroundColor Cyan

