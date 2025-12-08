Get-ChildItem -Path .\src -Recurse -Include *.ts,*.tsx -File | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content $file | Out-String

    # ✅ Debe contener el import correcto si usa useSupabase
    if ($content -match 'useSupabase' -and $content -notmatch 'import\s+{.*useSupabase.*}\s+from\s+"@/lib/supabase/client"') {
        Write-Host "❌ Falta import correcto en $file"
    }

    # ❌ No debe contener imports viejos o inicializaciones manuales
    if ($content -match 'app/providers' -or
        $content -match 'createBrowserSupabaseClient' -or
        $content -match 'createClient') {
        Write-Host "❌ Import incorrecto o inicialización manual en $file"
    }
}
