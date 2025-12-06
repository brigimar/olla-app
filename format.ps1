# format.ps1
# Script para formatear y lintar el proyecto antes de cada commit

Write-Host "🔧 Ejecutando Prettier en todo el proyecto..."
npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"

Write-Host "🔍 Ejecutando ESLint con autofix..."
npx eslint "src/**/*.{ts,tsx,js,jsx}" --fix

Write-Host "✅ Formato y lint completados. Listo para commit."
