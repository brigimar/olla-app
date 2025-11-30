-- ============================================================================
-- OLLA DEL BARRIO - POLÍTICAS RLS ANTI-BYPASS COMPLETAS
-- ============================================================================
-- Sistema de seguridad avanzado con Row Level Security (RLS)
-- Implementa controles temporales, validaciones por rol y protección de datos sensibles
-- Autor: Experto Senior PostgreSQL/Supabase Security
-- Fecha: 2024
-- ============================================================================

-- ============================================================================
-- 1. FUNCIONES AUXILIARES DE SEGURIDAD
-- ============================================================================

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(user_role_val, 'cliente'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_role() IS 'Obtiene el rol del usuario autenticado actual. Retorna NULL si no existe el perfil.';

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_admin() IS 'Verifica si el usuario actual es administrador.';

-- Función para verificar si una dirección puede ser revelada (30 min antes del retiro)
CREATE OR REPLACE FUNCTION can_reveal_address(order_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    order_record public.orders%ROWTYPE;
    time_until_pickup INTERVAL;
BEGIN
    -- Obtener información del pedido
    SELECT * INTO order_record
    FROM public.orders
    WHERE id = order_id_param;
    
    -- Si no existe el pedido, no se puede revelar
    IF order_record.id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar que el pedido esté pagado
    IF order_record.paid_at IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar que tenga pickup_time definido
    IF order_record.pickup_time IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Calcular tiempo hasta el retiro
    time_until_pickup := order_record.pickup_time - NOW();
    
    -- Solo revelar si está dentro de la ventana de 30 minutos antes del retiro
    -- y aún no ha pasado el tiempo de retiro
    IF time_until_pickup <= INTERVAL '30 minutes' 
       AND time_until_pickup >= INTERVAL '0 minutes' 
       AND order_record.status NOT IN ('delivered', 'cancelled') THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION can_reveal_address(UUID) IS 'Verifica si una dirección puede ser revelada según las reglas anti-bypass: pedido pagado y dentro de ventana de 30 minutos antes del retiro.';

-- Función para verificar si el usuario puede ver la dirección del productor en un pedido
CREATE OR REPLACE FUNCTION can_view_producer_address(order_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    order_record public.orders%ROWTYPE;
    user_role_val user_role;
BEGIN
    -- Obtener información del pedido
    SELECT * INTO order_record
    FROM public.orders
    WHERE id = order_id_param;
    
    -- Si no existe el pedido, no se puede ver
    IF order_record.id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Obtener rol del usuario
    user_role_val := get_user_role();
    
    -- Admins siempre pueden ver
    IF user_role_val = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Clientes solo pueden ver si está dentro de la ventana de tiempo
    IF user_role_val = 'cliente' AND order_record.client_id = auth.uid() THEN
        RETURN can_reveal_address(order_id_param);
    END IF;
    
    -- Productores pueden ver su propia dirección siempre
    IF user_role_val = 'productor' AND order_record.producer_id = auth.uid() THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION can_view_producer_address(UUID) IS 'Verifica si el usuario puede ver la dirección del productor según su rol y las reglas anti-bypass.';

-- Función para verificar si el usuario puede ver la dirección del cliente en un pedido
CREATE OR REPLACE FUNCTION can_view_client_address(order_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    order_record public.orders%ROWTYPE;
    user_role_val user_role;
BEGIN
    -- Obtener información del pedido
    SELECT * INTO order_record
    FROM public.orders
    WHERE id = order_id_param;
    
    -- Si no existe el pedido, no se puede ver
    IF order_record.id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Obtener rol del usuario
    user_role_val := get_user_role();
    
    -- Admins siempre pueden ver
    IF user_role_val = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Clientes pueden ver su propia dirección siempre
    IF user_role_val = 'cliente' AND order_record.client_id = auth.uid() THEN
        RETURN TRUE;
    END IF;
    
    -- Productores solo pueden ver si está dentro de la ventana de tiempo para entrega
    IF user_role_val = 'productor' AND order_record.producer_id = auth.uid() THEN
        RETURN can_reveal_address(order_id_param);
    END IF;
    
    -- Repartidores pueden ver si el pedido está asignado a ellos y dentro de la ventana
    IF user_role_val = 'repartidor' THEN
        -- TODO: Agregar lógica cuando se implemente asignación de repartidores
        RETURN can_reveal_address(order_id_param);
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION can_view_client_address(UUID) IS 'Verifica si el usuario puede ver la dirección del cliente según su rol y las reglas anti-bypass.';

-- Función para verificar si un plato está disponible en la zona del usuario
CREATE OR REPLACE FUNCTION is_dish_available_in_user_zone(dish_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    dish_record public.dishes%ROWTYPE;
    producer_record public.producers%ROWTYPE;
    user_zone_id INTEGER;
BEGIN
    -- Obtener información del plato
    SELECT * INTO dish_record
    FROM public.dishes
    WHERE id = dish_id_param;
    
    -- Si el plato no existe o no está disponible, retornar false
    IF dish_record.id IS NULL OR dish_record.is_available = FALSE THEN
        RETURN FALSE;
    END IF;
    
    -- Obtener información del productor
    SELECT * INTO producer_record
    FROM public.producers
    WHERE id = dish_record.producer_id;
    
    -- Si el productor no está activo, retornar false
    IF producer_record.id IS NULL OR producer_record.is_active = FALSE THEN
        RETURN FALSE;
    END IF;
    
    -- Si el usuario no tiene zona asignada, permitir ver todos los platos
    -- (esto se puede ajustar según la lógica de negocio)
    SELECT delivery_zone_id INTO user_zone_id
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- Si el usuario no tiene zona o el productor no tiene zona, permitir
    IF user_zone_id IS NULL OR producer_record.delivery_zone_id IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar que el plato esté en la misma zona del usuario
    RETURN producer_record.delivery_zone_id = user_zone_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_dish_available_in_user_zone(UUID) IS 'Verifica si un plato está disponible en la zona de delivery del usuario.';

-- ============================================================================
-- 2. ELIMINAR POLÍTICAS EXISTENTES (si existen)
-- ============================================================================

-- Eliminar todas las políticas existentes para recrearlas con lógica mejorada
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own profile" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can view public profiles" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all profiles" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Anyone can view active producers" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Producers can manage own profile" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Clients can view active producers" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all producers" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Anyone can view active zones" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Admins can manage zones" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Anyone can view available dishes" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Producers can manage own dishes" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Clients can view own orders" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Clients can create orders" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Producers can view own orders" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Producers can update own orders status" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all orders" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can view order items of visible orders" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Clients can view own payments" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Producers can view own payments" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all payments" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Producers can view own payouts" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Admins can manage payouts" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Producers can view own commissions" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all commissions" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can view unblocked messages of own orders" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can send messages in own orders" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all messages" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Only admins can view phone masking logs" ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- ============================================================================
-- 3. POLÍTICAS RLS PARA PROFILES
-- ============================================================================

-- 👤 CLIENTE: Puede ver su propio perfil completo
CREATE POLICY "cliente_ve_propio_perfil"
    ON public.profiles FOR SELECT
    USING (
        auth.uid() = id 
        AND get_user_role() = 'cliente'
    );

-- 👤 CLIENTE: Puede actualizar su propio perfil (excepto rol)
CREATE POLICY "cliente_actualiza_propio_perfil"
    ON public.profiles FOR UPDATE
    USING (
        auth.uid() = id 
        AND get_user_role() = 'cliente'
    )
    WITH CHECK (
        auth.uid() = id 
        AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    );

-- 👵 PRODUCTOR: Puede ver su propio perfil completo
CREATE POLICY "productor_ve_propio_perfil"
    ON public.profiles FOR SELECT
    USING (
        auth.uid() = id 
        AND get_user_role() = 'productor'
    );

-- 👵 PRODUCTOR: Puede actualizar su propio perfil (excepto rol)
CREATE POLICY "productor_actualiza_propio_perfil"
    ON public.profiles FOR UPDATE
    USING (
        auth.uid() = id 
        AND get_user_role() = 'productor'
    )
    WITH CHECK (
        auth.uid() = id 
        AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    );

-- 🚴 REPARTIDOR: Puede ver su propio perfil completo
CREATE POLICY "repartidor_ve_propio_perfil"
    ON public.profiles FOR SELECT
    USING (
        auth.uid() = id 
        AND get_user_role() = 'repartidor'
    );

-- 🚴 REPARTIDOR: Puede actualizar su propio perfil (excepto rol)
CREATE POLICY "repartidor_actualiza_propio_perfil"
    ON public.profiles FOR UPDATE
    USING (
        auth.uid() = id 
        AND get_user_role() = 'repartidor'
    )
    WITH CHECK (
        auth.uid() = id 
        AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    );

-- 👥 Todos pueden ver perfiles públicos (sin información sensible como teléfono)
-- Nota: La aplicación debe filtrar el campo 'phone' en las consultas
CREATE POLICY "todos_ven_perfiles_publicos"
    ON public.profiles FOR SELECT
    USING (true);

-- 👨‍💼 ADMIN: Acceso total a todos los perfiles
CREATE POLICY "admin_acceso_total_perfiles"
    ON public.profiles FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

COMMENT ON POLICY "cliente_ve_propio_perfil" ON public.profiles IS 'Los clientes pueden ver su propio perfil completo incluyendo teléfono (que nunca se expone directamente, solo para Twilio Proxy).';
COMMENT ON POLICY "todos_ven_perfiles_publicos" ON public.profiles IS 'Todos pueden ver perfiles públicos, pero la aplicación debe filtrar campos sensibles como teléfono.';

-- ============================================================================
-- 4. POLÍTICAS RLS PARA PRODUCERS
-- ============================================================================

-- 👤 CLIENTE: Puede ver productores activos (SIN dirección hasta después de pago)
CREATE POLICY "cliente_ve_productores_activos"
    ON public.producers FOR SELECT
    USING (
        is_active = true
        AND get_user_role() = 'cliente'
    );

-- 👵 PRODUCTOR: Puede ver y gestionar su propia información completa
CREATE POLICY "productor_gestiona_propio_perfil"
    ON public.producers FOR ALL
    USING (
        id = auth.uid() 
        AND get_user_role() = 'productor'
    )
    WITH CHECK (
        id = auth.uid() 
        AND get_user_role() = 'productor'
    );

-- 👨‍💼 ADMIN: Acceso total a todos los productores
CREATE POLICY "admin_acceso_total_productores"
    ON public.producers FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

COMMENT ON POLICY "cliente_ve_productores_activos" ON public.producers IS 'Los clientes pueden ver productores activos, pero la dirección se controla a nivel de aplicación usando can_view_producer_address().';

-- ============================================================================
-- 5. POLÍTICAS RLS PARA DELIVERY_ZONES
-- ============================================================================

-- 👥 Todos pueden ver zonas activas (necesario para búsqueda de productores)
CREATE POLICY "todos_ven_zonas_activas"
    ON public.delivery_zones FOR SELECT
    USING (is_active = true);

-- 👨‍💼 ADMIN: Puede gestionar todas las zonas
CREATE POLICY "admin_gestiona_zonas"
    ON public.delivery_zones FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

COMMENT ON POLICY "todos_ven_zonas_activas" ON public.delivery_zones IS 'Todos los usuarios pueden ver zonas activas para buscar productores por ubicación.';

-- ============================================================================
-- 6. POLÍTICAS RLS PARA DISHES
-- ============================================================================

-- 👤 CLIENTE: Solo ve platos activos en su zona de delivery
CREATE POLICY "cliente_ve_platos_zona_activos"
    ON public.dishes FOR SELECT
    USING (
        is_available = true
        AND get_user_role() = 'cliente'
        AND is_dish_available_in_user_zone(id)
    );

-- 👵 PRODUCTOR: Puede ver y gestionar todos sus platos
CREATE POLICY "productor_gestiona_propios_platos"
    ON public.dishes FOR ALL
    USING (
        producer_id = auth.uid() 
        AND get_user_role() = 'productor'
    )
    WITH CHECK (
        producer_id = auth.uid() 
        AND get_user_role() = 'productor'
    );

-- 👨‍💼 ADMIN: Acceso total a todos los platos
CREATE POLICY "admin_acceso_total_platos"
    ON public.dishes FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

COMMENT ON POLICY "cliente_ve_platos_zona_activos" ON public.dishes IS 'Los clientes solo ven platos activos que están disponibles en su zona de delivery.';

-- ============================================================================
-- 7. POLÍTICAS RLS PARA ORDERS (NÚCLEO ANTI-BYPASS)
-- ============================================================================

-- 👤 CLIENTE: Puede ver sus propios pedidos
CREATE POLICY "cliente_ve_propios_pedidos"
    ON public.orders FOR SELECT
    USING (
        client_id = auth.uid() 
        AND get_user_role() = 'cliente'
    );

-- 👤 CLIENTE: Puede crear pedidos
CREATE POLICY "cliente_crea_pedidos"
    ON public.orders FOR INSERT
    WITH CHECK (
        client_id = auth.uid() 
        AND get_user_role() = 'cliente'
    );

-- 👤 CLIENTE: Puede actualizar sus pedidos (solo antes de pago)
CREATE POLICY "cliente_actualiza_pedidos_pendientes"
    ON public.orders FOR UPDATE
    USING (
        client_id = auth.uid() 
        AND get_user_role() = 'cliente'
        AND status = 'pending'
        AND paid_at IS NULL
    )
    WITH CHECK (
        client_id = auth.uid()
        AND status = 'pending'
    );

-- 👵 PRODUCTOR: Puede ver pedidos dirigidos a él
CREATE POLICY "productor_ve_pedidos_propios"
    ON public.orders FOR SELECT
    USING (
        producer_id = auth.uid() 
        AND get_user_role() = 'productor'
    );

-- 👵 PRODUCTOR: Puede actualizar estado de sus pedidos
-- Nota: La validación de campos inmutables (montos, client_id, paid_at) 
-- se debe hacer a nivel de aplicación o con triggers
CREATE POLICY "productor_actualiza_estado_pedidos"
    ON public.orders FOR UPDATE
    USING (
        producer_id = auth.uid() 
        AND get_user_role() = 'productor'
    )
    WITH CHECK (
        producer_id = auth.uid()
        AND get_user_role() = 'productor'
    );

-- 🚴 REPARTIDOR: Puede ver pedidos asignados (cuando se implemente asignación)
-- Por ahora, puede ver pedidos en estado 'ready' o 'delivered'
CREATE POLICY "repartidor_ve_pedidos_asignados"
    ON public.orders FOR SELECT
    USING (
        get_user_role() = 'repartidor'
        AND status IN ('ready', 'delivered')
    );

-- 🚴 REPARTIDOR: Puede actualizar estado de pedidos asignados
CREATE POLICY "repartidor_actualiza_estado_entrega"
    ON public.orders FOR UPDATE
    USING (
        get_user_role() = 'repartidor'
        AND status IN ('ready', 'delivered')
    )
    WITH CHECK (
        get_user_role() = 'repartidor'
        -- Solo puede cambiar a 'delivered'
        AND (status = 'delivered' OR status = OLD.status)
    );

-- 👨‍💼 ADMIN: Acceso total a todos los pedidos
CREATE POLICY "admin_acceso_total_pedidos"
    ON public.orders FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

COMMENT ON POLICY "cliente_ve_propios_pedidos" ON public.orders IS 'Los clientes pueden ver sus pedidos, pero la dirección del productor se controla con can_view_producer_address().';
COMMENT ON POLICY "productor_ve_pedidos_propios" ON public.orders IS 'Los productores pueden ver sus pedidos, pero la dirección del cliente se controla con can_view_client_address().';

-- ============================================================================
-- 8. POLÍTICAS RLS PARA ORDER_ITEMS
-- ============================================================================

-- 👤 CLIENTE: Puede ver items de sus pedidos
CREATE POLICY "cliente_ve_items_propios_pedidos"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.client_id = auth.uid()
            AND get_user_role() = 'cliente'
        )
    );

-- 👵 PRODUCTOR: Puede ver items de pedidos dirigidos a él
CREATE POLICY "productor_ve_items_pedidos_propios"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.producer_id = auth.uid()
            AND get_user_role() = 'productor'
        )
    );

-- 🚴 REPARTIDOR: Puede ver items de pedidos asignados
CREATE POLICY "repartidor_ve_items_pedidos_asignados"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.status IN ('ready', 'delivered')
            AND get_user_role() = 'repartidor'
        )
    );

-- 👨‍💼 ADMIN: Acceso total a todos los items
CREATE POLICY "admin_acceso_total_items"
    ON public.order_items FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

COMMENT ON POLICY "cliente_ve_items_propios_pedidos" ON public.order_items IS 'Los clientes pueden ver los items de sus propios pedidos.';

-- ============================================================================
-- 9. POLÍTICAS RLS PARA PAYMENTS
-- ============================================================================

-- 👤 CLIENTE: Puede ver pagos de sus pedidos
CREATE POLICY "cliente_ve_pagos_propios"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = payments.order_id
            AND orders.client_id = auth.uid()
            AND get_user_role() = 'cliente'
        )
    );

-- 👵 PRODUCTOR: Puede ver pagos de pedidos dirigidos a él (para ver comisiones)
CREATE POLICY "productor_ve_pagos_pedidos_propios"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = payments.order_id
            AND orders.producer_id = auth.uid()
            AND get_user_role() = 'productor'
        )
    );

-- 👨‍💼 ADMIN: Acceso total a todos los pagos
CREATE POLICY "admin_acceso_total_pagos"
    ON public.payments FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

COMMENT ON POLICY "cliente_ve_pagos_propios" ON public.payments IS 'Los clientes pueden ver los pagos de sus propios pedidos.';
COMMENT ON POLICY "productor_ve_pagos_pedidos_propios" ON public.payments IS 'Los productores pueden ver pagos de sus pedidos para verificar comisiones.';

-- ============================================================================
-- 10. POLÍTICAS RLS PARA PAYOUTS
-- ============================================================================

-- 👵 PRODUCTOR: Solo puede ver sus propias liquidaciones
CREATE POLICY "productor_ve_propias_liquidaciones"
    ON public.payouts FOR SELECT
    USING (
        producer_id = auth.uid() 
        AND get_user_role() = 'productor'
    );

-- 👨‍💼 ADMIN: Puede gestionar todas las liquidaciones
CREATE POLICY "admin_gestiona_liquidaciones"
    ON public.payouts FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

COMMENT ON POLICY "productor_ve_propias_liquidaciones" ON public.payouts IS 'Los productores solo pueden ver sus propias liquidaciones.';

-- ============================================================================
-- 11. POLÍTICAS RLS PARA COMMISSIONS
-- ============================================================================

-- 👵 PRODUCTOR: Solo puede ver comisiones de sus pedidos
CREATE POLICY "productor_ve_propias_comisiones"
    ON public.commissions FOR SELECT
    USING (
        producer_id = auth.uid() 
        AND get_user_role() = 'productor'
    );

-- 👨‍💼 ADMIN: Acceso total a todas las comisiones
CREATE POLICY "admin_acceso_total_comisiones"
    ON public.commissions FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

COMMENT ON POLICY "productor_ve_propias_comisiones" ON public.commissions IS 'Los productores solo pueden ver comisiones de sus propios pedidos.';

-- ============================================================================
-- 12. POLÍTICAS RLS PARA CHAT_MESSAGES
-- ============================================================================

-- 👤 CLIENTE: Puede ver mensajes no bloqueados de sus pedidos
CREATE POLICY "cliente_ve_mensajes_pedidos_propios"
    ON public.chat_messages FOR SELECT
    USING (
        is_blocked = false
        AND (
            sender_id = auth.uid() 
            OR receiver_id = auth.uid()
        )
        AND get_user_role() = 'cliente'
        AND EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = chat_messages.order_id
            AND orders.client_id = auth.uid()
        )
    );

-- 👤 CLIENTE: Puede enviar mensajes en sus pedidos
CREATE POLICY "cliente_envia_mensajes_pedidos_propios"
    ON public.chat_messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() 
        AND get_user_role() = 'cliente'
        AND EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = chat_messages.order_id
            AND orders.client_id = auth.uid()
        )
    );

-- 👵 PRODUCTOR: Puede ver mensajes no bloqueados de sus pedidos
CREATE POLICY "productor_ve_mensajes_pedidos_propios"
    ON public.chat_messages FOR SELECT
    USING (
        is_blocked = false
        AND (
            sender_id = auth.uid() 
            OR receiver_id = auth.uid()
        )
        AND get_user_role() = 'productor'
        AND EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = chat_messages.order_id
            AND orders.producer_id = auth.uid()
        )
    );

-- 👵 PRODUCTOR: Puede enviar mensajes en sus pedidos
CREATE POLICY "productor_envia_mensajes_pedidos_propios"
    ON public.chat_messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() 
        AND get_user_role() = 'productor'
        AND EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = chat_messages.order_id
            AND orders.producer_id = auth.uid()
        )
    );

-- 🚴 REPARTIDOR: Puede ver mensajes de pedidos asignados
CREATE POLICY "repartidor_ve_mensajes_pedidos_asignados"
    ON public.chat_messages FOR SELECT
    USING (
        is_blocked = false
        AND get_user_role() = 'repartidor'
        AND EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = chat_messages.order_id
            AND orders.status IN ('ready', 'delivered')
        )
    );

-- 👨‍💼 ADMIN: Puede ver todos los mensajes (incluidos bloqueados para auditoría)
CREATE POLICY "admin_ve_todos_mensajes"
    ON public.chat_messages FOR SELECT
    USING (is_admin());

COMMENT ON POLICY "cliente_ve_mensajes_pedidos_propios" ON public.chat_messages IS 'Los clientes solo ven mensajes no bloqueados de sus pedidos. Los mensajes con números/emails se bloquean automáticamente.';
COMMENT ON POLICY "productor_ve_mensajes_pedidos_propios" ON public.chat_messages IS 'Los productores solo ven mensajes no bloqueados de sus pedidos. Los mensajes con números/emails se bloquean automáticamente.';

-- ============================================================================
-- 13. POLÍTICAS RLS PARA PHONE_MASKING_LOGS
-- ============================================================================

-- 🔒 CRÍTICO: Solo admins pueden ver logs de enmascaramiento
-- Esto previene que usuarios vean números reales
CREATE POLICY "solo_admin_ve_logs_enmascaramiento"
    ON public.phone_masking_logs FOR SELECT
    USING (is_admin());

-- 🔒 CRÍTICO: Solo el sistema (service role) puede crear logs
-- Esto se maneja a nivel de aplicación con service role key
-- No se crea política INSERT para usuarios normales

COMMENT ON POLICY "solo_admin_ve_logs_enmascaramiento" ON public.phone_masking_logs IS 'CRÍTICO: Solo admins pueden ver logs de enmascaramiento. Los números reales NUNCA se exponen a usuarios normales.';

-- ============================================================================
-- 13.5. TRIGGER PARA VALIDAR CAMPOS INMUTABLES EN ORDERS
-- ============================================================================

-- Función para validar que productores no modifiquen campos críticos
CREATE OR REPLACE FUNCTION validate_order_immutable_fields()
RETURNS TRIGGER AS $$
DECLARE
    user_role_val user_role;
BEGIN
    -- Obtener rol del usuario que hace la actualización
    SELECT role INTO user_role_val
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- Si es productor, validar que no cambie campos críticos
    IF user_role_val = 'productor' AND OLD.producer_id = auth.uid() THEN
        -- Validar que campos críticos no cambien
        IF NEW.subtotal_cents != OLD.subtotal_cents THEN
            RAISE EXCEPTION 'Los productores no pueden modificar el subtotal del pedido';
        END IF;
        
        IF NEW.commission_cents != OLD.commission_cents THEN
            RAISE EXCEPTION 'Los productores no pueden modificar la comisión del pedido';
        END IF;
        
        IF NEW.total_cents != OLD.total_cents THEN
            RAISE EXCEPTION 'Los productores no pueden modificar el total del pedido';
        END IF;
        
        IF NEW.client_id != OLD.client_id THEN
            RAISE EXCEPTION 'Los productores no pueden modificar el cliente del pedido';
        END IF;
        
        IF NEW.paid_at IS DISTINCT FROM OLD.paid_at THEN
            RAISE EXCEPTION 'Los productores no pueden modificar el timestamp de pago';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para validar campos inmutables
CREATE TRIGGER validate_order_immutable_fields_trigger
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_order_immutable_fields();

COMMENT ON FUNCTION validate_order_immutable_fields() IS 'Valida que los productores no modifiquen campos críticos como montos, client_id o paid_at al actualizar pedidos.';

-- ============================================================================
-- 14. VISTAS SEGURAS PARA APLICACIÓN
-- ============================================================================

-- Vista segura para clientes: Productores sin dirección
CREATE OR REPLACE VIEW vw_producers_public AS
SELECT 
    id,
    business_name,
    description,
    delivery_zone_id,
    is_active,
    rating,
    total_orders,
    created_at,
    updated_at
    -- address y address_point NO se incluyen
FROM public.producers
WHERE is_active = true;

COMMENT ON VIEW vw_producers_public IS 'Vista pública de productores sin información sensible como dirección. Los clientes usan esta vista para buscar productores.';

-- Vista segura para clientes: Pedidos con dirección condicional
CREATE OR REPLACE VIEW vw_orders_client AS
SELECT 
    id,
    client_id,
    producer_id,
    status,
    -- Dirección del productor solo si está en ventana de tiempo
    CASE 
        WHEN can_view_producer_address(id) THEN public.producers.address
        ELSE NULL
    END AS producer_address,
    -- Dirección del cliente siempre visible para el cliente
    delivery_address,
    pickup_time,
    subtotal_cents,
    commission_cents,
    total_cents,
    created_at,
    paid_at,
    address_revealed_at,
    updated_at
FROM public.orders
LEFT JOIN public.producers ON public.orders.producer_id = public.producers.id
WHERE client_id = auth.uid();

COMMENT ON VIEW vw_orders_client IS 'Vista segura para clientes: muestra dirección del productor solo si está dentro de la ventana de 30 minutos antes del retiro.';

-- Vista segura para productores: Pedidos con dirección condicional
CREATE OR REPLACE VIEW vw_orders_producer AS
SELECT 
    id,
    client_id,
    producer_id,
    status,
    -- Dirección del cliente solo si está en ventana de tiempo
    CASE 
        WHEN can_view_client_address(id) THEN public.orders.delivery_address
        ELSE NULL
    END AS client_delivery_address,
    -- Dirección del productor siempre visible para el productor
    public.producers.address AS producer_address,
    pickup_time,
    subtotal_cents,
    commission_cents,
    total_cents,
    created_at,
    paid_at,
    address_revealed_at,
    updated_at
FROM public.orders
LEFT JOIN public.producers ON public.orders.producer_id = public.producers.id
WHERE producer_id = auth.uid();

COMMENT ON VIEW vw_orders_producer IS 'Vista segura para productores: muestra dirección del cliente solo si está dentro de la ventana de 30 minutos antes del retiro.';

-- ============================================================================
-- 15. GRANTS Y PERMISSIONS
-- ============================================================================

-- Permitir que usuarios autenticados usen las funciones de seguridad
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION can_reveal_address(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_producer_address(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_client_address(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_dish_available_in_user_zone(UUID) TO authenticated;

-- Permitir que usuarios autenticados usen las vistas
GRANT SELECT ON vw_producers_public TO authenticated;
GRANT SELECT ON vw_orders_client TO authenticated;
GRANT SELECT ON vw_orders_producer TO authenticated;

-- ============================================================================
-- FIN DE POLÍTICAS RLS
-- ============================================================================

-- NOTAS IMPORTANTES PARA IMPLEMENTACIÓN:
--
-- 1. CONTROL DE DIRECCIONES:
--    - Las direcciones se controlan a nivel de aplicación usando las funciones
--      can_view_producer_address() y can_view_client_address()
--    - Las vistas vw_orders_client y vw_orders_producer implementan esta lógica
--    - La aplicación debe usar estas vistas en lugar de consultar directamente orders
--
-- 2. CONTROL DE TELÉFONOS:
--    - Los teléfonos NUNCA se exponen directamente
--    - Se usan solo para configurar Twilio Proxy
--    - Los logs de enmascaramiento solo son visibles para admins
--
-- 3. CHAT SEGURO:
--    - Los mensajes con números/emails se bloquean automáticamente por trigger
--    - Solo se muestran mensajes no bloqueados (is_blocked = false)
--    - Los admins pueden ver todos los mensajes para auditoría
--
-- 4. ZONAS DE DELIVERY:
--    - Los clientes solo ven platos de su zona
--    - La función is_dish_available_in_user_zone() implementa esta lógica
--
-- 5. TESTING:
--    - Probar cada política con diferentes roles
--    - Verificar que las direcciones solo se revelen en la ventana de tiempo
--    - Verificar que los teléfonos nunca se expongan
--    - Verificar que el chat bloquee mensajes con información de contacto

