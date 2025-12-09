# Ruta base del proyecto
$basePath = "E:\BuenosPasos\boilerplate\frontend"

# Buscar todas las apariciones de window.location.origin en .ts y .tsx
Select-String -Path "$basePath\src\**\*.ts*" -Pattern "window.location.origin" |
    ForEach-Object {
        Write-Host "Archivo: $($_.Path)"
        Write-Host "Línea $($_.LineNumber): $($_.Line.Trim())"
        Write-Host "---------------------------------------------"
    }
