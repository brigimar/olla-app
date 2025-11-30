-- ============================================================================
-- OLLA DEL BARRIO - ÍNDICES OPTIMIZADOS PARA MÁXIMO RENDIMIENTO
-- ============================================================================
-- Estrategia de indexación para optimizar consultas críticas del marketplace
-- Autor: DBA Senior PostgreSQL/Supabase
-- Fecha: 2024
-- ============================================================================

-- ============================================================================
-- 1. ELIMINAR ÍNDICES BÁSICOS (si existen) PARA REEMPLAZARLOS CON VERSIONES OPTIMIZADAS
-- ============================================================================

-- Nota: Los índices básicos del schema inicial se mantienen, pero agregamos
-- índices compuestos y parciales más específicos para consultas complejas

-- ============================================================================
-- 2. ÍNDICES PARA DISHES - Búsqueda de platos por zona
-- ============================================================================
-- NOTA IMPORTANTE: dishes NO tiene delivery_zone_id directamente.
-- La búsqueda por zona requiere JOIN con producers:
-- SELECT d.* FROM dishes d 
-- JOIN producers p ON d.producer_id = p.id 
-- WHERE p.delivery_zone_id = X AND d.is_available = true
-- 
-- Los índices están optimizados para este patrón de consulta.
-- ============================================================================

-- 🍲 Índice compuesto para búsqueda de platos activos por categoría y precio
-- Nota: La búsqueda por zona se hace a través de JOIN con producers
-- Optimiza: SELECT d.* FROM dishes d JOIN producers p ON d.producer_id = p.id 
--           WHERE p.delivery_zone_id = X AND d.is_available = true AND d.category = Y
--           ORDER BY p.rating DESC, d.price_cents ASC
CREATE INDEX IF NOT EXISTS idx_dishes_category_price_active 
ON dishes (category, is_available, price_cents ASC)
WHERE is_available = true AND category IS NOT NULL;

COMMENT ON INDEX idx_dishes_category_price_active IS 'Índice compuesto para búsqueda de platos activos por categoría y precio. La búsqueda por zona se optimiza con idx_producers_zone_active_rating.';

-- 🍲 Índice para búsqueda de platos por productor activo
-- Optimiza: SELECT * FROM dishes WHERE producer_id = X AND is_available = true
CREATE INDEX IF NOT EXISTS idx_dishes_producer_active_optimized
ON dishes (producer_id, is_available, created_at DESC)
WHERE is_available = true;

COMMENT ON INDEX idx_dishes_producer_active_optimized IS 'Índice parcial para platos activos de un productor, ordenados por fecha de creación. Optimiza dashboards de productores.';

-- 🍲 Índice para búsqueda por categoría y precio
-- Optimiza: SELECT * FROM dishes WHERE category = X AND is_available = true ORDER BY price_cents
CREATE INDEX IF NOT EXISTS idx_dishes_category_price
ON dishes (category, price_cents ASC, is_available)
WHERE is_available = true AND category IS NOT NULL;

COMMENT ON INDEX idx_dishes_category_price IS 'Índice para búsqueda de platos por categoría ordenados por precio. Optimiza filtros de búsqueda en el frontend.';

-- 🍲 Índice para búsqueda de platos por productor y disponibilidad
-- Optimiza JOINs con producers para búsqueda por zona
CREATE INDEX IF NOT EXISTS idx_dishes_producer_available_price
ON dishes (producer_id, is_available, price_cents ASC)
WHERE is_available = true;

COMMENT ON INDEX idx_dishes_producer_available_price IS 'Índice para optimizar JOINs entre dishes y producers. La búsqueda por zona se hace combinando este índice con idx_producers_zone_active_rating.';

-- ============================================================================
-- 3. ÍNDICES PARA ORDERS - Consultas temporales anti-bypass y dashboards
-- ============================================================================

-- 📦 Índice compuesto para consultas de clientes por estado y fecha
-- Optimiza: SELECT * FROM orders WHERE client_id = X AND status = Y AND created_at >= Z
CREATE INDEX IF NOT EXISTS idx_orders_client_status_date
ON orders (client_id, status, created_at DESC)
WHERE status != 'cancelled';

COMMENT ON INDEX idx_orders_client_status_date IS 'Índice compuesto para consultas de pedidos de clientes por estado y fecha. Optimiza historial de pedidos y dashboards de clientes.';

-- 📦 Índice compuesto para consultas de productores por estado y fecha
-- Optimiza: SELECT * FROM orders WHERE producer_id = X AND status = Y AND created_at >= Z
CREATE INDEX IF NOT EXISTS idx_orders_producer_status_date
ON orders (producer_id, status, created_at DESC)
WHERE status != 'cancelled';

COMMENT ON INDEX idx_orders_producer_status_date IS 'Índice compuesto para consultas de pedidos de productores por estado y fecha. Optimiza dashboards y reportes de productores.';

-- 📦 Índice CRÍTICO para consultas anti-bypass temporales
-- Optimiza: SELECT * FROM orders WHERE paid_at IS NOT NULL AND pickup_time BETWEEN X AND Y
-- Para verificar ventana de 30 minutos
CREATE INDEX IF NOT EXISTS idx_orders_paid_pickup_time
ON orders (paid_at, pickup_time, status, address_revealed_at)
WHERE paid_at IS NOT NULL AND pickup_time IS NOT NULL;

COMMENT ON INDEX idx_orders_paid_pickup_time IS 'Índice crítico para consultas anti-bypass que verifican ventanas de tiempo de 30 minutos. Optimiza reveal_producer_contact() y triggers.';

-- 📦 Índice para pedidos activos por productor (para dashboards)
-- Optimiza: SELECT * FROM orders WHERE producer_id = X AND status IN ('confirmed', 'preparing', 'ready')
CREATE INDEX IF NOT EXISTS idx_orders_producer_active
ON orders (producer_id, status, paid_at DESC)
WHERE status IN ('confirmed', 'preparing', 'ready', 'delivered');

COMMENT ON INDEX idx_orders_producer_active IS 'Índice parcial para pedidos activos de productores. Optimiza dashboards y métricas en tiempo real.';

-- 📦 Índice para pedidos pendientes de pago
-- Optimiza: SELECT * FROM orders WHERE status = 'pending' AND created_at < X (timeout)
CREATE INDEX IF NOT EXISTS idx_orders_pending_timeout
ON orders (status, created_at)
WHERE status = 'pending';

COMMENT ON INDEX idx_orders_pending_timeout IS 'Índice para identificar pedidos pendientes que pueden necesitar timeout. Optimiza limpieza de pedidos abandonados.';

-- 📦 Índice para consultas de dirección revelada (anti-bypass)
-- Optimiza verificaciones de address_revealed_at
CREATE INDEX IF NOT EXISTS idx_orders_address_revealed
ON orders (address_revealed_at, pickup_time, status)
WHERE address_revealed_at IS NOT NULL;

COMMENT ON INDEX idx_orders_address_revealed IS 'Índice para consultas que verifican si una dirección fue revelada. Optimiza lógica anti-bypass.';

-- ============================================================================
-- 4. ÍNDICES PARA CHAT_MESSAGES - Chat en tiempo real
-- ============================================================================

-- 💬 Índice compuesto para mensajes de un pedido ordenados por fecha
-- Optimiza: SELECT * FROM chat_messages WHERE order_id = X AND is_blocked = false ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_chat_messages_order_unblocked
ON chat_messages (order_id, created_at DESC, is_blocked)
WHERE is_blocked = false;

COMMENT ON INDEX idx_chat_messages_order_unblocked IS 'Índice parcial para mensajes no bloqueados de un pedido, ordenados por fecha. Optimiza carga de conversaciones en tiempo real.';

-- 💬 Índice para búsqueda de conversaciones activas
-- Optimiza: SELECT DISTINCT order_id FROM chat_messages WHERE sender_id = X OR receiver_id = X
CREATE INDEX IF NOT EXISTS idx_chat_messages_participants
ON chat_messages (sender_id, receiver_id, order_id, created_at DESC);

COMMENT ON INDEX idx_chat_messages_participants IS 'Índice para búsqueda de conversaciones donde un usuario participa. Optimiza listado de chats activos.';

-- 💬 Índice para mensajes bloqueados (auditoría)
-- Optimiza: SELECT * FROM chat_messages WHERE is_blocked = true AND created_at >= X
CREATE INDEX IF NOT EXISTS idx_chat_messages_blocked_audit
ON chat_messages (is_blocked, created_at DESC, sender_id)
WHERE is_blocked = true;

COMMENT ON INDEX idx_chat_messages_blocked_audit IS 'Índice para auditoría de mensajes bloqueados. Optimiza reportes de intentos de bypass.';

-- 💬 Índice para último mensaje de cada pedido
-- Optimiza: SELECT DISTINCT ON (order_id) * FROM chat_messages ORDER BY order_id, created_at DESC
CREATE INDEX IF NOT EXISTS idx_chat_messages_order_latest
ON chat_messages (order_id, created_at DESC);

COMMENT ON INDEX idx_chat_messages_order_latest IS 'Índice para obtener el último mensaje de cada pedido. Optimiza previews de conversaciones.';

-- ============================================================================
-- 5. ÍNDICES PARA PAYMENTS - Dashboards y reportes
-- ============================================================================

-- 💰 Índice compuesto para pagos por pedido y estado
-- Optimiza: SELECT * FROM payments WHERE order_id = X AND status = Y
CREATE INDEX IF NOT EXISTS idx_payments_order_status
ON payments (order_id, status, created_at DESC);

COMMENT ON INDEX idx_payments_order_status IS 'Índice compuesto para consultas de pagos por pedido y estado. Optimiza verificación de pagos y webhooks.';

-- 💰 Índice para pagos aprobados por fecha (reportes)
-- Optimiza: SELECT * FROM payments WHERE status = 'approved' AND created_at BETWEEN X AND Y
CREATE INDEX IF NOT EXISTS idx_payments_approved_date
ON payments (status, created_at DESC, amount_cents)
WHERE status = 'approved';

COMMENT ON INDEX idx_payments_approved_date IS 'Índice parcial para pagos aprobados ordenados por fecha. Optimiza reportes financieros y dashboards.';

-- 💰 Índice para búsqueda por ID de Mercado Pago
-- Optimiza: SELECT * FROM payments WHERE mercado_pago_payment_id = X
CREATE INDEX IF NOT EXISTS idx_payments_mp_id
ON payments (mercado_pago_payment_id)
WHERE mercado_pago_payment_id IS NOT NULL;

COMMENT ON INDEX idx_payments_mp_id IS 'Índice único para búsqueda rápida de pagos por ID de Mercado Pago. Optimiza procesamiento de webhooks.';

-- ============================================================================
-- 6. ÍNDICES PARA COMMISSIONS - Reportes de comisiones
-- ============================================================================

-- 💵 Índice para comisiones por productor y fecha
-- Optimiza: SELECT * FROM commissions WHERE producer_id = X AND created_at >= Y
CREATE INDEX IF NOT EXISTS idx_commissions_producer_date
ON commissions (producer_id, created_at DESC, payout_id);

COMMENT ON INDEX idx_commissions_producer_date IS 'Índice para consultas de comisiones por productor y fecha. Optimiza cálculos de liquidaciones y reportes.';

-- 💵 Índice para comisiones pendientes de liquidación
-- Optimiza: SELECT * FROM commissions WHERE payout_id IS NULL
CREATE INDEX IF NOT EXISTS idx_commissions_unpaid
ON commissions (producer_id, created_at)
WHERE payout_id IS NULL;

COMMENT ON INDEX idx_commissions_unpaid IS 'Índice parcial para comisiones pendientes de liquidación. Optimiza proceso de payouts.';

-- ============================================================================
-- 7. ÍNDICES PARA PAYOUTS - Liquidaciones
-- ============================================================================

-- 💸 Índice para liquidaciones por productor y estado
-- Optimiza: SELECT * FROM payouts WHERE producer_id = X AND status = Y
CREATE INDEX IF NOT EXISTS idx_payouts_producer_status
ON payouts (producer_id, status, period_end DESC);

COMMENT ON INDEX idx_payouts_producer_status IS 'Índice para consultas de liquidaciones por productor y estado. Optimiza historial de pagos a productores.';

-- 💸 Índice para liquidaciones por período
-- Optimiza: SELECT * FROM payouts WHERE period_start >= X AND period_end <= Y
CREATE INDEX IF NOT EXISTS idx_payouts_period
ON payouts (period_start, period_end, status);

COMMENT ON INDEX idx_payouts_period IS 'Índice para consultas de liquidaciones por período. Optimiza reportes financieros.';

-- ============================================================================
-- 8. ÍNDICES PARA PRODUCERS - Búsqueda y dashboards
-- ============================================================================

-- 👵 Índice compuesto para productores activos por zona y rating
-- Optimiza: SELECT * FROM producers WHERE delivery_zone_id = X AND is_active = true ORDER BY rating DESC
-- También optimiza JOINs con dishes para búsqueda de platos por zona
CREATE INDEX IF NOT EXISTS idx_producers_zone_active_rating
ON producers (delivery_zone_id, is_active, rating DESC NULLS LAST, total_orders DESC)
WHERE is_active = true;

COMMENT ON INDEX idx_producers_zone_active_rating IS 'Índice compuesto para búsqueda de productores activos por zona ordenados por rating. Optimiza listados de productores y JOINs con dishes para búsqueda de platos por zona.';

-- 👵 Índice para búsqueda geoespacial de productores (PostGIS)
-- Optimiza: SELECT * FROM producers WHERE ST_Within(address_point, polygon)
-- Ya existe idx_producers_address_point, pero lo documentamos aquí
COMMENT ON INDEX idx_producers_address_point IS 'Índice GIST para búsquedas geoespaciales de productores. Optimiza consultas PostGIS de radio de cobertura.';

-- ============================================================================
-- 9. ÍNDICES PARA PROFILES - Búsqueda de usuarios
-- ============================================================================

-- 👥 Índice para búsqueda de usuarios por rol
-- Optimiza: SELECT * FROM profiles WHERE role = X
CREATE INDEX IF NOT EXISTS idx_profiles_role
ON profiles (role, created_at DESC);

COMMENT ON INDEX idx_profiles_role IS 'Índice para búsqueda de usuarios por rol. Optimiza consultas de usuarios por tipo (cliente, productor, repartidor, admin).';

-- 👥 Índice para búsqueda de productores por nombre de negocio
-- Optimiza: SELECT * FROM producers WHERE business_name ILIKE '%X%'
-- Nota: Para búsquedas de texto, considerar índice GIN con pg_trgm
CREATE INDEX IF NOT EXISTS idx_producers_business_name_trgm
ON producers USING gin (business_name gin_trgm_ops);

COMMENT ON INDEX idx_producers_business_name_trgm IS 'Índice GIN con trigramas para búsqueda de texto parcial en nombres de negocios. Requiere extensión pg_trgm.';

-- ============================================================================
-- 10. ÍNDICES PARA DELIVERY_ZONES - Consultas geoespaciales
-- ============================================================================

-- 🗺️ Índice GIST para polígonos (ya existe, pero lo documentamos)
COMMENT ON INDEX idx_delivery_zones_polygon IS 'Índice GIST para búsquedas geoespaciales de zonas. Optimiza ST_Within() y ST_Intersects() para determinar zona de un punto.';

-- 🗺️ Índice para zonas activas
CREATE INDEX IF NOT EXISTS idx_delivery_zones_active
ON delivery_zones (is_active, name)
WHERE is_active = true;

COMMENT ON INDEX idx_delivery_zones_active IS 'Índice parcial para zonas activas. Optimiza listados de zonas disponibles.';

-- ============================================================================
-- 11. ÍNDICES PARA ORDER_ITEMS - Agregaciones y reportes
-- ============================================================================

-- 📋 Índice para items por pedido
-- Optimiza: SELECT * FROM order_items WHERE order_id = X
CREATE INDEX IF NOT EXISTS idx_order_items_order
ON order_items (order_id, created_at);

COMMENT ON INDEX idx_order_items_order IS 'Índice para consultas de items de un pedido. Optimiza carga de detalles de pedidos.';

-- 📋 Índice para agregaciones de platos más vendidos
-- Optimiza: SELECT oi.dish_id, SUM(oi.quantity) FROM order_items oi 
--           JOIN orders o ON oi.order_id = o.id 
--           WHERE o.status IN ('confirmed', 'preparing', 'ready', 'delivered')
--           GROUP BY oi.dish_id
CREATE INDEX IF NOT EXISTS idx_order_items_dish_quantity
ON order_items (dish_id, quantity, created_at);

COMMENT ON INDEX idx_order_items_dish_quantity IS 'Índice para agregaciones de platos más vendidos. Optimiza dashboards y reportes de popularidad. Se combina con idx_orders_producer_active para filtros por estado.';

-- ============================================================================
-- 12. ÍNDICES PARA PHONE_MASKING_LOGS - Auditoría y seguridad
-- ============================================================================

-- 📞 Índice para logs activos por pedido
-- Optimiza: SELECT * FROM phone_masking_logs WHERE order_id = X AND is_active = true
CREATE INDEX IF NOT EXISTS idx_phone_masking_active_order
ON phone_masking_logs (order_id, is_active, created_at DESC)
WHERE is_active = true;

COMMENT ON INDEX idx_phone_masking_active_order IS 'Índice parcial para logs activos de enmascaramiento por pedido. Optimiza verificación de proxies activos.';

-- 📞 Índice para logs por usuario
-- Optimiza: SELECT * FROM phone_masking_logs WHERE caller_id = X OR receiver_id = X
CREATE INDEX IF NOT EXISTS idx_phone_masking_users
ON phone_masking_logs (caller_id, receiver_id, created_at DESC);

COMMENT ON INDEX idx_phone_masking_users IS 'Índice para consultas de logs por usuario. Optimiza auditoría de enmascaramiento.';

-- ============================================================================
-- 13. EXTENSIONES NECESARIAS PARA ÍNDICES DE TEXTO
-- ============================================================================

-- Habilitar extensión pg_trgm para búsquedas de texto con trigramas
CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMENT ON EXTENSION pg_trgm IS 'Extensión para búsquedas de texto eficientes usando trigramas. Usada en idx_producers_business_name_trgm.';

-- ============================================================================
-- 14. ANÁLISIS Y MANTENIMIENTO
-- ============================================================================

-- Función para analizar uso de índices (útil para monitoreo)
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE (
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    idx_scan BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::TEXT,
        tablename::TEXT,
        indexname::TEXT,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION analyze_index_usage() IS 'Función para analizar el uso de índices. Útil para identificar índices no utilizados que pueden eliminarse.';

-- ============================================================================
-- 15. COMENTARIOS SOBRE TRADE-OFFS
-- ============================================================================

-- TRADE-OFFS CONSIDERADOS:
--
-- 1. ESPACIO vs PERFORMANCE:
--    - Los índices compuestos ocupan más espacio pero aceleran consultas complejas
--    - Los índices parciales (WHERE) reducen espacio y mejoran performance para consultas específicas
--    - Índices GIST para PostGIS son necesarios pero ocupan más espacio que B-tree
--
-- 2. WRITE PERFORMANCE:
--    - Múltiples índices pueden ralentizar INSERT/UPDATE
--    - Los índices parciales minimizan este impacto al indexar solo datos relevantes
--    - Considerar índices CONCURRENTLY para producción sin downtime
--
-- 3. ÍNDICES NO UTILIZADOS:
--    - Usar analyze_index_usage() periódicamente para identificar índices no usados
--    - Eliminar índices no utilizados para mejorar write performance
--
-- 4. ÍNDICES FALTANTES:
--    - Monitorear slow queries con pg_stat_statements
--    - Agregar índices según necesidad real de consultas
--
-- 5. MANTENIMIENTO:
--    - Ejecutar VACUUM ANALYZE regularmente
--    - Reindexar periódicamente índices con alta fragmentación
--    - Monitorear tamaño de índices vs tamaño de tablas

-- ============================================================================
-- 16. RECOMENDACIONES DE MANTENIMIENTO
-- ============================================================================

-- Script para analizar y mantener índices (ejecutar periódicamente)
/*
-- 1. Analizar uso de índices
SELECT * FROM analyze_index_usage();

-- 2. Identificar índices no utilizados (idx_scan = 0)
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public' 
  AND idx_scan = 0
  AND indexrelid NOT IN (
      SELECT conindid FROM pg_constraint
  )
ORDER BY pg_relation_size(indexrelid) DESC;

-- 3. Identificar tablas que necesitan VACUUM
SELECT 
    schemaname,
    tablename,
    n_dead_tup,
    n_live_tup,
    round(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_ratio
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 1000
ORDER BY dead_ratio DESC;

-- 4. Tamaño de índices vs tablas
SELECT 
    t.tablename,
    pg_size_pretty(pg_total_relation_size('public.' || t.tablename)) AS total_size,
    pg_size_pretty(pg_relation_size('public.' || t.tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size('public.' || t.tablename) - 
                   pg_relation_size('public.' || t.tablename)) AS indexes_size
FROM pg_tables t
WHERE t.schemaname = 'public'
ORDER BY pg_total_relation_size('public.' || t.tablename) DESC;
*/

-- ============================================================================
-- FIN DE ÍNDICES OPTIMIZADOS
-- ============================================================================

-- NOTAS FINALES:
--
-- 1. Estos índices están optimizados para las consultas críticas identificadas
-- 2. Monitorear performance en producción y ajustar según necesidad
-- 3. Considerar crear índices CONCURRENTLY en producción para evitar locks
-- 4. Revisar periódicamente índices no utilizados y eliminarlos
-- 5. Mantener estadísticas actualizadas con VACUUM ANALYZE

