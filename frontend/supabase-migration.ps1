Write-Host "=== INICIANDO MIGRACION SUPABASE ===" -ForegroundColor Cyan

# -------------------------------------------------------------------
# 1. ELIMINAR CLIENTE ANTIGUO
# -------------------------------------------------------------------
$oldClient = "src/lib/supabase/client.ts"

if (Test-Path $oldClient) {
    Write-Host "Eliminando archivo antiguo: $oldClient" -ForegroundColor Yellow
    Remove-Item $oldClient -Force
} else {
    Write-Host "Archivo antiguo no encontrado (OK)" -ForegroundColor Green
}

# -------------------------------------------------------------------
# 2. GENERAR NUEVO CLIENTE
# -------------------------------------------------------------------
$newClientContent = @"
'use client';

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';

export const createClient = (): SupabaseClient => {
  return createBrowserSupabaseClient();
};
"@

Write-Host "Generando nuevo archivo actualizado: src/lib/supabase/client.ts" -ForegroundColor Yellow
$newClientContent | Out-File -FilePath "src/lib/supabase/client.ts" -Encoding UTF8

# -------------------------------------------------------------------
# 3. REEMPLAZOS (IMPORTS + createClient) CON RUTAS ESCAPADAS
# -------------------------------------------------------------------
Write-Host "Actualizando imports obsoletos..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "src" -Recurse -Include *.ts, *.tsx -ErrorAction SilentlyContinue

foreach ($file in $files) {

    try {
        # Escapar corchetes para que PowerShell pueda leerlos correctamente
        $safePath = $file.FullName.Replace("[", "`[").Replace("]", "`]")

        $content = Get-Content -LiteralPath $safePath -Raw

        $updated = $content `
            -replace "import\s+{?\s*supabase\s*}?\s*from\s*['""]@/lib/supabase/client['""];", "import { useSupabase } from '@/app/providers';"

        $updated | Out-File -LiteralPath $safePath -Encoding UTF8
    }
    catch {
        Write-Host "No se pudo procesar archivo: $safePath" -ForegroundColor Red
    }
}

# -------------------------------------------------------------------
# 4. CORREGIR createClient() RESIDUALES
# -------------------------------------------------------------------
Write-Host "Corrigiendo llamadas a cr
