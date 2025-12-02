param(
    [string]$Path = ".",
    [int]$Indent = 0
)

function Show-Tree {
    param(
        [string]$Folder,
        [int]$Level
    )

    # Excluir carpetas pesadas
    $exclude = @('node_modules', '.next')

    # Obtener subcarpetas y archivos
    $items = Get-ChildItem -Force -LiteralPath $Folder | Sort-Object PSIsContainer, Name

    foreach ($item in $items) {
        if ($exclude -contains $item.Name) {
            continue
        }

        $prefix = " " * ($Level * 2)
        if ($item.PSIsContainer) {
            Write-Output "$prefix|-- $($item.Name)/"
            Show-Tree -Folder $item.FullName -Level ($Level + 1)
        } else {
            Write-Output "$prefix|-- $($item.Name)"
        }
    }
}

Write-Output "$Path/"
Show-Tree -Folder $Path -Level $Indent
