Write-Host "🚀 Corrigiendo errores comunes..."

Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx | ForEach-Object {
    $content = Get-Content $_.FullName -Raw

    # 1. Reemplazar 'any' por 'unknown'
    $content = $content -replace "\bany\b", "unknown"

    # 2. Eliminar imports no usados
    $content = $content -replace "import\s+\{\s*User\s*\}.*\n", ""
    $content = $content -replace "import\s+\{\s*Phone\s*\}.*\n", ""
    $content = $content -replace "import\s+\{\s*MapPin\s*\}.*\n", ""

    # 3. Corregir JSX suelto (TestCheckout.tsx)
    $content = $content -replace "^\s*<([A-Z].*)>$", "return (<$1>)"

    # Guardar cambios
    Set-Content -Path $_.FullName -Value $content
}

Write-Host "✅ Correcciones aplicadas. Ahora ejecuta:"
Write-Host "   npx eslint src --fix"
Write-Host "   npx tsc --noEmit"
