Write-Host "Iniciando limpieza de warnings..."

# 1. Renombrar variables no usadas con prefijo "_"
# Busca patrones de variables asignadas pero no usadas y las renombra
Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx | ForEach-Object {
    (Get-Content $_.FullName) |
    ForEach-Object {
        $_ -replace '(\b)([a-zA-Z0-9_]+)(?=.*is assigned a value but never used)', '_$2'
    } | Set-Content $_.FullName
}

# 2. Eliminar imports sobrantes
# Usa eslint con autofix para borrar imports no usados
Write-Host ".\fis.ps1
Eliminando imports sobrantes con ESLint..."
npx eslint src --fix

Write-Host "Limpieza completada. Revisa tu código para confirmar cambios."
