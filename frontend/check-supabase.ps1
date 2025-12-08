# check-supabase.ps1
Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx |
Select-String -Pattern "\bsupabase\b" |
ForEach-Object {
    $line = $_.Line.Trim()
    $file = $_.Path
    $ln   = $_.LineNumber

    if ($line -notmatch "useSupabase" -and $line -notmatch "createBrowserClient") {
        Write-Output "❌ Posible uso sin inicializar: ${file}:${ln} → $line"
    }
}
