-- ============================================================================
-- 010_seed_producer.sql
-- Inserta un usuario de prueba, su perfil y su productor asociado
-- Idempotente: no falla si ya existen los registros
-- ============================================================================

-- 1. Crear usuario base en auth.users
INSERT INTO auth.users (id, email, created_at, updated_at)
VALUES (
    '9cb351ed-b0c1-439d-a883-0735bc97f396',
    'panaderia@example.com',
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear perfil asociado en public.profiles
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
VALUES (
    '9cb351ed-b0c1-439d-a883-0735bc97f396',
    'Panadería del Barrio',
    'productor',
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;

-- 3. Crear productor asociado en public.producers
INSERT INTO public.producers (
    id, business_name, description, address, delivery_zone_id,
    is_active, rating, total_orders, created_at, updated_at
)
VALUES (
    '9cb351ed-b0c1-439d-a883-0735bc97f396',
    'Panadería del Barrio',
    'Pan artesanal',
    'Av. Siempre Viva 123',
    NULL,
    TRUE,
    4.50,
    10,
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;
