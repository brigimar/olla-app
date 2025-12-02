# rebuild-v1.ps1
# Script para limpiar y recompilar todos los .py en backend/app/api/v1/

# Ruta base del proyecto
$basePath = "E:\BuenosPasos\boilerplate\backend\app\api\v1"

Write-Host "🔄 Limpiando y reconstruyendo archivos Python en $basePath ..."

# 1. Eliminar archivos compilados (.pyc) y carpetas __pycache__
Get-ChildItem -Path $basePath -Recurse -Include *.pyc | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path $basePath -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "✅ Archivos .pyc y carpetas __pycache__ eliminados."

# 2. Recompilar todos los .py en la carpeta v1
python -m compileall $basePath

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Recompilación exitosa de todos los archivos .py en /v1/"
} else {
    Write-Host "❌ Error al recompilar los archivos Python."
}
