-- ============================================================================
-- 009_fix_get_public_producers.sql
-- Corrige la función get_public_producers para que coincida con el esquema real
-- ============================================================================

-- Eliminamos la versión anterior si existiera
DROP FUNCTION IF EXISTS get_public_producers;

-- Creamos la función con firma explícita y tipos correctos
CREATE OR REPLACE FUNCTION get_public_producers()
RETURNS TABLE (
    id uuid,
    business_name text,
    description text,
    delivery_zone_id integer, -- ajustado al tipo real en producers
    is_active boolean,
    rating numeric,
    total_orders integer,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
    SELECT id,
           business_name,
           description,
           delivery_zone_id,
           is_active,
           rating,
           total_orders,
           created_at,
           updated_at
    FROM public.producers
    WHERE is_active = TRUE;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
