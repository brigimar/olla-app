Write-Host "=== Ejecutando fix.ps1 ===" -ForegroundColor Cyan

# (1) Archivos requeridos con contenido base
$filesToCreate = @{
    "frontend\src\components\Navbar.tsx" = @"
export default function Navbar() {
  return (
    <nav className='w-full p-4 shadow'>
      <h1>Navbar</h1>
    </nav>
  );
}
"@

    "frontend\src\components\layout.tsx" = @"
export default function Layout({ children }: { children: React.ReactNode }) {
  return <main>{children}</main>;
}
"@

    "frontend\src\lib\api.ts" = @"
export const api = {
  hello: () => 'ok'
};
"@

    "frontend\src\lib\supabase.ts" = @"
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
"@
}

# (2) Crear archivos faltantes
Write-Host ""
Write-Host "Checking required files..." -ForegroundColor Yellow

foreach ($path in $filesToCreate.Keys) {

    $fullPath = Join-Path -Path $PSScriptRoot -ChildPath $path
    $dir = Split-Path $fullPath

    if (!(Test-Path $dir)) {
        Write-Host "  Creating directory: $dir" -ForegroundColor DarkGray
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    if (!(Test-Path $fullPath)) {
        Write-Host "  Creating missing file: $path" -ForegroundColor Green
        Set-Content -Path $fullPath -Value $filesToCreate[$path] -Encoding UTF8
    } else {
        Write-Host "  Exists: $path" -ForegroundColor DarkGray
    }
}

# (3) Aviso sobre duplicados en styles
# (3) Check style duplicates
Write-Host ""
Write-Host "Checking style duplicates..." -ForegroundColor Yellow

$globalCSS = "frontend\src\styles\global.css"
$globalsCSS = "frontend\src\styles\globals.css"

if ( (Test-Path $globalCSS) -and (Test-Path $globalsCSS) ) {
    Write-Host "  Warning: Both global.css and globals.css exist." -ForegroundColor DarkGray
}

# (4) Fin
Write-Host ""
Write-Host "=== Frontend fix completed successfully ===" -ForegroundColor Cyan
