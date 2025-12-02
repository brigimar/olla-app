# fix-migrations.ps1

# 1. Definir la función al inicio
function Run-Sql {
    param([string]$sql)
    Write-Host "Ejecutando: $sql"
    supabase db query "$sql"
}

# 2. Usar la función después
Run-Sql @"
CREATE OR REPLACE FUNCTION get_public_producers()
RETURNS TABLE (
    id uuid,
    business_name text,
    description text,
    delivery_zone_id uuid,
    is_active boolean,
    rating numeric,
    total_orders integer,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
    SELECT id, business_name, description, delivery_zone_id, is_active,
           rating, total_orders, created_at, updated_at
    FROM public.producers
    WHERE is_active = TRUE;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
"@

# 3. Comprobación inmediata
Run-Sql "SELECT * FROM get_public_producers() LIMIT 5;"
