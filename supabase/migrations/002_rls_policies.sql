-- ============================================================================
-- OLLA DEL BARRIO - POLÍTICAS RLS ANTI-BYPASS COMPLETAS (CORREGIDO y COMPLETO)
-- ============================================================================
-- Nota: Asume que:
--   - El tipo ENUM `user_role` y `order_status` ya existen
--   - Las tablas ya están creadas
--   - PostGIS ya fue instalado en una migración previa
-- ============================================================================

-- ============================================================================
-- 1. FUNCIONES AUXILIARES DE SEGURIDAD
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN user_role_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT (role = 'admin') FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_reveal_address(order_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    paid BOOLEAN;
    pickup_time TIMESTAMPTZ;
    current_time TIMESTAMPTZ := NOW();
BEGIN
    SELECT (paid_at IS NOT NULL), pickup_time
    INTO paid, pickup_time
    FROM public.orders
    WHERE id = order_id_param;

    IF NOT paid OR pickup_time IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN (
        pickup_time - current_time <= INTERVAL '30 minutes' AND
        pickup_time - current_time >= INTERVAL '0 minutes' AND
        (SELECT status FROM public.orders WHERE id = order_id_param) NOT IN ('delivered', 'cancelled')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_view_producer_address(order_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    client_id UUID;
    producer_id UUID;
    user_id UUID := auth.uid();
    user_role_val user_role := get_user_role();
BEGIN
    SELECT o.client_id, o.producer_id
    INTO client_id, producer_id
    FROM public.orders o
    WHERE o.id = order_id_param;

    IF client_id IS NULL THEN
        RETURN FALSE;
    END IF;

    IF user_role_val = 'admin' THEN
        RETURN TRUE;
    ELSIF user_role_val = 'cliente' AND client_id = user_id THEN
        RETURN can_reveal_address(order_id_param);
    ELSIF user_role_val = 'productor' AND producer_id = user_id THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_view_client_address(order_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    client_id UUID;
    producer_id UUID;
    user_id UUID := auth.uid();
    user_role_val user_role := get_user_role();
BEGIN
    SELECT o.client_id, o.producer_id
    INTO client_id, producer_id
    FROM public.orders o
    WHERE o.id = order_id_param;

    IF client_id IS NULL THEN
        RETURN FALSE;
    END IF;

    IF user_role_val = 'admin' THEN
        RETURN TRUE;
    ELSIF user_role_val = 'cliente' AND client_id = user_id THEN
        RETURN TRUE;
    ELSIF user_role_val = 'productor' AND producer_id = user_id THEN
        RETURN can_reveal_address(order_id_param);
    ELSIF user_role_val = 'repartidor' THEN
        RETURN can_reveal_address(order_id_param);
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_dish_available_in_user_zone(dish_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    producer_zone_id INT;
    user_zone_id INT;
BEGIN
    SELECT p.delivery_zone_id, pf.delivery_zone_id
    INTO producer_zone_id, user_zone_id
    FROM public.dishes d
    JOIN public.producers p ON d.producer_id = p.id
    JOIN public.profiles pf ON pf.id = auth.uid()
    WHERE d.id = dish_id_param
      AND d.is_available = TRUE
      AND p.is_active = TRUE;

    IF producer_zone_id IS NULL THEN
        RETURN FALSE;
    END IF;

    IF user_zone_id IS NULL THEN
        RETURN TRUE;
    END IF;

    RETURN producer_zone_id = user_zone_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 2. FUNCIÓN DE TRIGGER FALTANTE (¡AHORA SÍ DEFINIDA!)
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_order_immutable_fields()
RETURNS TRIGGER AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val
    FROM public.profiles
    WHERE id = auth.uid();

    IF user_role_val = 'productor' AND OLD.producer_id = auth.uid() THEN
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

-- ============================================================================
-- 3. ELIMINAR POLÍTICAS EXISTENTES
-- ============================================================================
DO $$
DECLARE
    business_tables TEXT[] := ARRAY[
        'profiles', 'producers', 'delivery_zones', 'dishes', 'orders',
        'order_items', 'payments', 'payouts', 'commissions',
        'chat_messages', 'phone_masking_logs'
    ];
    table_name TEXT;
    policy_record RECORD;
BEGIN
    FOREACH table_name IN ARRAY business_tables
    LOOP
        FOR policy_record IN 
            SELECT policyname FROM pg_policies WHERE tablename = table_name
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, table_name);
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- 4. ACTIVAR RLS EN TODAS LAS TABLAS
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_masking_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. POLÍTICAS RLS COMPLETAS
-- ============================================================================

-- PROFILES
CREATE POLICY "users_view_own_profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- PRODUCERS
CREATE POLICY "clientes_view_active_producers"
    ON public.producers FOR SELECT
    USING (is_active = TRUE AND get_user_role() IN ('cliente', 'repartidor'));

CREATE POLICY "productores_manage_own"
    ON public.producers FOR ALL
    USING (auth.uid() = id AND get_user_role() = 'productor');

CREATE POLICY "admin_manage_all_producers"
    ON public.producers FOR ALL
    USING (is_admin());

-- DELIVERY_ZONES
CREATE POLICY "active_zones_viewable"
    ON public.delivery_zones FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "admin_manage_zones"
    ON public.delivery_zones FOR ALL
    USING (is_admin());

-- DISHES
CREATE POLICY "clientes_view_available_dishes_in_zone"
    ON public.dishes FOR SELECT
    USING (is_available = TRUE AND get_user_role() = 'cliente' AND is_dish_available_in_user_zone(id));

CREATE POLICY "productores_manage_own_dishes"
    ON public.dishes FOR ALL
    USING (auth.uid() = producer_id AND get_user_role() = 'productor');

CREATE POLICY "admin_manage_all_dishes"
    ON public.dishes FOR ALL
    USING (is_admin());

-- ORDERS
CREATE POLICY "cliente_select_own_orders"
    ON public.orders FOR SELECT
    USING (client_id = auth.uid() AND get_user_role() = 'cliente');

CREATE POLICY "cliente_insert_orders"
    ON public.orders FOR INSERT
    WITH CHECK (client_id = auth.uid() AND get_user_role() = 'cliente');

CREATE POLICY "cliente_update_pending_orders"
    ON public.orders FOR UPDATE
    USING (client_id = auth.uid() AND get_user_role() = 'cliente' AND status = 'pending' AND paid_at IS NULL)
    WITH CHECK (client_id = auth.uid() AND status = 'pending');

CREATE POLICY "productor_select_own_orders"
    ON public.orders FOR SELECT
    USING (producer_id = auth.uid() AND get_user_role() = 'productor');

CREATE POLICY "productor_update_own_orders"
    ON public.orders FOR UPDATE
    USING (producer_id = auth.uid() AND get_user_role() = 'productor')
    WITH CHECK (producer_id = auth.uid());

CREATE POLICY "repartidor_select_assigned_orders"
    ON public.orders FOR SELECT
    USING (get_user_role() = 'repartidor' AND status IN ('ready', 'delivered'));

CREATE POLICY "repartidor_update_delivery_status"
    ON public.orders FOR UPDATE
    USING (get_user_role() = 'repartidor' AND status IN ('ready', 'delivered'))
    WITH CHECK (get_user_role() = 'repartidor');

CREATE POLICY "admin_full_access_orders"
    ON public.orders FOR ALL
    USING (is_admin());

-- ORDER_ITEMS
CREATE POLICY "cliente_view_own_order_items"
    ON public.order_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND client_id = auth.uid() AND get_user_role() = 'cliente'));

CREATE POLICY "productor_view_own_order_items"
    ON public.order_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND producer_id = auth.uid() AND get_user_role() = 'productor'));

CREATE POLICY "repartidor_view_assigned_order_items"
    ON public.order_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND status IN ('ready', 'delivered') AND get_user_role() = 'repartidor'));

CREATE POLICY "admin_full_access_order_items"
    ON public.order_items FOR ALL
    USING (is_admin());

-- PAYMENTS
CREATE POLICY "cliente_view_own_payments"
    ON public.payments FOR SELECT
    USING (EXISTS (SELECT 1 FROM orders WHERE id = payments.order_id AND client_id = auth.uid() AND get_user_role() = 'cliente'));

CREATE POLICY "productor_view_own_payments"
    ON public.payments FOR SELECT
    USING (EXISTS (SELECT 1 FROM orders WHERE id = payments.order_id AND producer_id = auth.uid() AND get_user_role() = 'productor'));

CREATE POLICY "admin_full_access_payments"
    ON public.payments FOR ALL
    USING (is_admin());

-- PAYOUTS
CREATE POLICY "productor_view_own_payouts"
    ON public.payouts FOR SELECT
    USING (producer_id = auth.uid() AND get_user_role() = 'productor');

CREATE POLICY "admin_full_access_payouts"
    ON public.payouts FOR ALL
    USING (is_admin());

-- COMMISSIONS
CREATE POLICY "productor_view_own_commissions"
    ON public.commissions FOR SELECT
    USING (producer_id = auth.uid() AND get_user_role() = 'productor');

CREATE POLICY "admin_full_access_commissions"
    ON public.commissions FOR ALL
    USING (is_admin());

-- CHAT_MESSAGES
CREATE POLICY "users_view_own_chat_messages"
    ON public.chat_messages FOR SELECT
    USING (
        is_blocked = FALSE
        AND (sender_id = auth.uid() OR receiver_id = auth.uid())
        AND (
            (get_user_role() = 'cliente' AND EXISTS (SELECT 1 FROM orders WHERE id = chat_messages.order_id AND client_id = auth.uid()))
            OR (get_user_role() = 'productor' AND EXISTS (SELECT 1 FROM orders WHERE id = chat_messages.order_id AND producer_id = auth.uid()))
            OR (get_user_role() = 'repartidor' AND EXISTS (SELECT 1 FROM orders WHERE id = chat_messages.order_id AND status IN ('ready', 'delivered')))
        )
    );

CREATE POLICY "users_send_chat_messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND (
            (get_user_role() = 'cliente' AND EXISTS (SELECT 1 FROM orders WHERE id = chat_messages.order_id AND client_id = auth.uid()))
            OR (get_user_role() = 'productor' AND EXISTS (SELECT 1 FROM orders WHERE id = chat_messages.order_id AND producer_id = auth.uid()))
        )
    );

CREATE POLICY "admin_view_all_chat_messages"
    ON public.chat_messages FOR SELECT
    USING (is_admin());

-- PHONE_MASKING_LOGS
CREATE POLICY "admin_view_masking_logs"
    ON public.phone_masking_logs FOR SELECT
    USING (is_admin());

-- ============================================================================
-- 6. TRIGGER (AHORA SÍ TIENE LA FUNCIÓN DEFINIDA)
-- ============================================================================
DROP TRIGGER IF EXISTS validate_order_immutable_fields_trigger ON public.orders;
CREATE TRIGGER validate_order_immutable_fields_trigger
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_order_immutable_fields();

-- ============================================================================
-- 7. FUNCIONES SEGURAS PARA LA APP (EN LUGAR DE VISTAS)
-- ============================================================================
-- Función corregida: retorna columnas explícitas y evita mismatch de tipos
-- Función corregida: firma alineada al esquema real (delivery_zone_id integer)
CREATE OR REPLACE FUNCTION get_public_producers()
RETURNS TABLE (
    id uuid,
    business_name text,
    description text,
    delivery_zone_id integer,
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



DROP FUNCTION IF EXISTS get_client_orders(UUID);
CREATE OR REPLACE FUNCTION get_client_orders(user_id UUID)
RETURNS TABLE (
    id UUID,
    client_id UUID,
    producer_id UUID,
    status public.order_status,  -- Usa el esquema completo
    producer_address TEXT,
    delivery_address TEXT,
    pickup_time TIMESTAMPTZ,
    subtotal_cents INT,
    commission_cents INT,
    total_cents INT,
    created_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    address_revealed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
    SELECT
        o.id,
        o.client_id,
        o.producer_id,
        o.status,
        CASE WHEN can_view_producer_address(o.id) THEN p.address ELSE NULL END,
        o.delivery_address,
        o.pickup_time,
        o.subtotal_cents,
        o.commission_cents,
        o.total_cents,
        o.created_at,
        o.paid_at,
        o.address_revealed_at,
        o.updated_at
    FROM public.orders o
    LEFT JOIN public.producers p ON o.producer_id = p.id
    WHERE o.client_id = user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- 8. GRANTS
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION can_reveal_address(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_producer_address(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_client_address(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_dish_available_in_user_zone(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_producers() TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_orders(UUID) TO authenticated;

-- ============================================================================
-- FIN
-- ============================================================================