Write-Host "🚀 Iniciando reconstrucción completa (DIRECTA)..." -ForegroundColor Cyan

$Frontend = "frontend"
$Src = Join-Path $Frontend "src"

# ---------------------------------------------
# 1) BORRAR ARCHIVOS OBSOLETOS (CON EXCEPCIONES)
# ---------------------------------------------

Write-Host "🗑️  Eliminando archivos/carpetas obsoletos (respetando excepciones)..." -ForegroundColor Yellow

$protected = @(
    "src/components/layout.tsx",
    "src/components/Checkout.tsx",
    "src/components/PlatosCatalogo.tsx",
    "src/components/OnboardingProductor.tsx"
)

$obsolete = @(
    "app/app.py",
    "src/app/Dockerfile",
    "src/app/app",
    "src/app/pages",
    "src/pages",
    "src/components/Old",
    "src/components/backup",
    "src/components_unused",
    "src/old",
    "src/legacy",
    "src/deprecated",
    "public/temp",
    "public/old",
    "src/utils/helpers.ts"
)

foreach ($item in $obsolete) {
    $fullPath = Join-Path $Frontend $item

    if ($protected -contains $item) {
        Write-Host "  ⚠ Protegido (NO BORRAR): $item"
        continue
    }

    if (Test-Path $fullPath) {
        Remove-Item -Recurse -Force $fullPath
        Write-Host "  ✅ Borrado: $item"
    } else {
        Write-Host "  - No existe: $item"
    }
}

# ---------------------------------------------
# 2) CREAR ESTRUCTURA LIMPIA
# ---------------------------------------------

Write-Host "`n📁 Creando estructura limpia en frontend/src ..." -ForegroundColor Cyan

$folders = @(
    "app",
    "components",
    "features",
    "hooks",
    "lib",
    "styles",
    "utils",
    "types"
)

foreach ($dir in $folders) {
    $path = Join-Path $Src $dir
    New-Item -ItemType Directory -Force -Path $path | Out-Null
    Write-Host "  ✔ Existe: $path"
}

# ---------------------------------------------
# 3) PLACEHOLDERS (SIN SOBRESCRIBIR)
# ---------------------------------------------

Write-Host "`n🧩 Generando placeholders (sin sobrescribir)..." -ForegroundColor Green

$placeholders = @{
    "src/app/page.tsx" = @"
export default function Home() {
  return <div>Home</div>;
}
"@

    "src/app/layout.tsx" = @"
export default function RootLayout({ children }) {
  return <html><body>{children}</body></html>;
}
"@

    "src/utils/helpers.ts" = "export const format = (v) => v;"
}

foreach ($relativePath in $placeholders.Keys) {
    $fullPath = Join-Path $Frontend $relativePath

    if (Test-Path $fullPath) {
        Write-Host "  🔒 Existe: $relativePath (no sobrescrito)"
    } else {
        New-Item -ItemType File -Path $fullPath -Force | Out-Null
        Set-Content -Path $fullPath -Value $placeholders[$relativePath]
        Write-Host "  ✳ Creado: $relativePath"
    }
}

# ---------------------------------------------
# 4) REESCRIBIR IMPORTS (EXCLUYENDO .next/)
# ---------------------------------------------

Write-Host "`n🔎 Reescribiendo imports comunes en .ts y .tsx ..." -ForegroundColor Yellow

$tsFiles = Get-ChildItem -Path $Src -Recurse -Include *.ts, *.tsx |
    Where-Object { $_.FullName -notmatch "\\.next\\" }

foreach ($file in $tsFiles) {
    try {
        $content = Get-Content $file.FullName -Raw

        $content = $content.Replace("@/lib/", "../lib/")
        $content = $content.Replace("@/components/", "../components/")
        $content = $content.Replace("@/utils/", "../utils/")

        Set-Content -Path $file.FullName -Value $content

        Write-Host "  ✔ Editado: $($file.Name)"
    }
    catch {
        Write-Host "  ⚠ Error editando $($file.FullName): $_"
    }
}


Write-Host "`n🎉 Reconstrucción del frontend COMPLETADA con éxito." -ForegroundColor Green
