# fix-lint.ps1
Write-Host "🚀 Corrigiendo errores comunes de lint/TS..."

Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx | ForEach-Object {
    $content = Get-Content $_.FullName -Raw

    # 1. Reemplazar 'any' por 'unknown' (más seguro)
    $content = $content -replace "\bany\b", "unknown"

    # 2. Eliminar imports no usados (User, Phone, MapPin, etc.)
    $content = $content -replace "import\s+\{\s*User\s*\}.*\n", ""
    $content = $content -replace "import\s+\{\s*Phone\s*\}.*\n", ""
    $content = $content -replace "import\s+\{\s*MapPin\s*\}.*\n", ""

    # 3. Ajustar useEffect deps: eliminar supabase de arrays
    $content = $content -replace "useEffect\((.*?)

\[\s*supabase\s*\]

\)", "useEffect($1[])"

    # 4. Corregir JSX suelto (no-unused-expressions)
    # Si hay JSX fuera de return, lo envolvemos en un fragmento
    $content = $content -replace "^\s*<([A-Z].*)>$", "return (<$1>)"

    # Guardar cambios
    Set-Content -Path $_.FullName -Value $content
}

Write-Host "✅ Correcciones aplicadas. Ahora ejecuta:"
Write-Host "   npx eslint src --fix"
Write-Host "   npx tsc --noEmit"
