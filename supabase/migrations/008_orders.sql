-- ============================================================================
-- MIGRACIÓN 008: Tabla orders simplificada
-- ============================================================================
-- Crea la tabla orders con campos básicos e inserta datos de ejemplo
-- Script idempotente: puede ejecutarse múltiples veces sin errores
-- ============================================================================

-- Extensión necesaria para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Crear la tabla orders si no existe
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    product text NOT NULL,
    quantity int NOT NULL,
    status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now()
);

-- Agregar comentarios a la tabla y columnas
COMMENT ON TABLE public.orders IS 'Tabla de pedidos simplificada para pruebas y desarrollo';
COMMENT ON COLUMN public.orders.id IS 'Identificador único del pedido';
COMMENT ON COLUMN public.orders.user_id IS 'ID del usuario que realizó el pedido';
COMMENT ON COLUMN public.orders.product IS 'Nombre del producto pedido';
COMMENT ON COLUMN public.orders.quantity IS 'Cantidad del producto';
COMMENT ON COLUMN public.orders.status IS 'Estado del pedido: pending, paid, shipped, etc.';
COMMENT ON COLUMN public.orders.created_at IS 'Fecha y hora de creación del pedido';

-- Insertar datos de ejemplo (idempotente usando IDs específicos)
-- Usamos IDs fijos para que ON CONFLICT funcione correctamente
INSERT INTO public.orders (id, user_id, product, quantity, status, created_at)
VALUES 
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        '11111111-1111-1111-1111-111111111111'::uuid,
        'Milanesa Napolitana',
        2,
        'pending',
        now() - interval '2 days'
    ),
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid,
        'Empanadas de Carne',
        12,
        'paid',
        now() - interval '1 day'
    ),
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid,
        '33333333-3333-3333-3333-333333333333'::uuid,
        'Pizza Muzzarella',
        1,
        'shipped',
        now() - interval '3 hours'
    )
ON CONFLICT (id) DO NOTHING;

-- Verificar que los datos se insertaron correctamente
DO $$
DECLARE
    order_count int;
BEGIN
    SELECT COUNT(*) INTO order_count FROM public.orders;
    RAISE NOTICE 'Total de pedidos en la tabla: %', order_count;
END $$;

