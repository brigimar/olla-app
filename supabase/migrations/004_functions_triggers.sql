-- ============================================================================
-- OLLA DEL BARRIO - FUNCIONES RPC Y TRIGGERS ANTI-BYPASS
-- ============================================================================
-- Funciones de negocio y triggers para lógica anti-bypass
-- Integración con frontend Next.js y backend FastAPI
-- Autor: Ingeniero Senior PostgreSQL/Supabase
-- Fecha: 2024
-- ============================================================================

-- ============================================================================
-- 1. FUNCIONES RPC CRÍTICAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 🛡️ reveal_producer_contact - Revela contacto del productor con validaciones
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reveal_producer_contact(
    order_id_param UUID,
    user_id_param UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
    order_record public.orders%ROWTYPE;
    producer_record public.producers%ROWTYPE;
    profile_record public.profiles%ROWTYPE;
    time_until_pickup INTERVAL;
    result JSONB;
BEGIN
    -- Validar que el usuario esté autenticado
    IF user_id_param IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Obtener información del pedido
    SELECT * INTO order_record
    FROM public.orders
    WHERE id = order_id_param;
    
    -- Validar que el pedido existe
    IF order_record.id IS NULL THEN
        RAISE EXCEPTION 'Pedido no encontrado';
    END IF;
    
    -- Validar que el usuario es el cliente del pedido
    IF order_record.client_id != user_id_param THEN
        RAISE EXCEPTION 'No tienes permiso para ver el contacto de este pedido';
    END IF;
    
    -- Validar que el pedido está pagado
    IF order_record.paid_at IS NULL THEN
        RAISE EXCEPTION 'El pedido debe estar pagado para ver el contacto';
    END IF;
    
    -- Validar estado del pedido
    IF order_record.status NOT IN ('confirmed', 'preparing', 'ready') THEN
        RAISE EXCEPTION 'El pedido debe estar confirmado, en preparación o listo para ver el contacto';
    END IF;
    
    -- Validar que tiene pickup_time definido
    IF order_record.pickup_time IS NULL THEN
        RAISE EXCEPTION 'El pedido no tiene hora de retiro programada';
    END IF;
    
    -- Calcular tiempo hasta el retiro
    time_until_pickup := order_record.pickup_time - NOW();
    
    -- Validar ventana de 30 minutos
    IF time_until_pickup > INTERVAL '30 minutes' THEN
        RAISE EXCEPTION 'El contacto solo se puede ver 30 minutos antes del retiro programado. Faltan % minutos', 
            EXTRACT(EPOCH FROM time_until_pickup) / 60;
    END IF;
    
    IF time_until_pickup < INTERVAL '0 minutes' THEN
        RAISE EXCEPTION 'El tiempo de retiro ya pasó';
    END IF;
    
    -- Obtener información del productor
    SELECT * INTO producer_record
    FROM public.producers
    WHERE id = order_record.producer_id;
    
    -- Obtener perfil del productor
    SELECT * INTO profile_record
    FROM public.profiles
    WHERE id = order_record.producer_id;
    
    -- Actualizar address_revealed_at si aún no está revelado
    IF order_record.address_revealed_at IS NULL THEN
        UPDATE public.orders
        SET address_revealed_at = NOW()
        WHERE id = order_id_param;
        
        order_record.address_revealed_at := NOW();
    END IF;
    
    -- Construir respuesta (NUNCA incluir teléfono real, solo dirección)
    result := jsonb_build_object(
        'success', true,
        'order_id', order_id_param,
        'producer', jsonb_build_object(
            'id', producer_record.id,
            'business_name', producer_record.business_name,
            'address', producer_record.address, -- Solo visible en ventana de tiempo
            'address_revealed_at', order_record.address_revealed_at,
            'pickup_time', order_record.pickup_time,
            'time_until_pickup_minutes', EXTRACT(EPOCH FROM time_until_pickup) / 60
        ),
        'message', 'Contacto revelado. Recuerda que la dirección solo es visible 30 minutos antes del retiro.'
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reveal_producer_contact(UUID, UUID) IS 'Revela el contacto del productor al cliente solo si el pedido está pagado y dentro de la ventana de 30 minutos antes del retiro. NUNCA expone el teléfono real.';

-- ----------------------------------------------------------------------------
-- 🛡️ mask_phone_number - Enmascara números según contexto
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mask_phone_number(
    phone_param TEXT,
    context_param TEXT DEFAULT 'client_view'
)
RETURNS TEXT AS $$
DECLARE
    masked_phone TEXT;
    phone_length INTEGER;
BEGIN
    -- Validar que el teléfono no sea NULL
    IF phone_param IS NULL OR phone_param = '' THEN
        RETURN NULL;
    END IF;
    
    -- Limpiar el teléfono (remover espacios, guiones, etc.)
    phone_param := regexp_replace(phone_param, '[^0-9+]', '', 'g');
    phone_length := length(phone_param);
    
    -- Enmascarar según contexto
    CASE context_param
        WHEN 'client_view' THEN
            -- Cliente ve: XXX-XXX-1234 (últimos 4 dígitos)
            IF phone_length >= 4 THEN
                masked_phone := 'XXX-XXX-' || right(phone_param, 4);
            ELSE
                masked_phone := 'XXX-XXX-XXXX';
            END IF;
            
        WHEN 'delivery_view' THEN
            -- Repartidor ve: número temporal de Twilio Proxy
            -- En producción, esto debería consultar phone_masking_logs
            -- Por ahora, retornamos un placeholder
            masked_phone := 'Twilio-Proxy-' || substr(md5(phone_param), 1, 8);
            
        WHEN 'admin_view' THEN
            -- Admin ve número completo (solo para admins)
            IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
                masked_phone := phone_param;
            ELSE
                RAISE EXCEPTION 'Solo administradores pueden ver números completos';
            END IF;
            
        ELSE
            -- Por defecto, enmascarar como client_view
            IF phone_length >= 4 THEN
                masked_phone := 'XXX-XXX-' || right(phone_param, 4);
            ELSE
                masked_phone := 'XXX-XXX-XXXX';
            END IF;
    END CASE;
    
    RETURN masked_phone;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'XXX-XXX-XXXX';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mask_phone_number(TEXT, TEXT) IS 'Enmascara números de teléfono según el contexto: client_view (parcial), delivery_view (Twilio Proxy), admin_view (completo solo para admins).';

-- ----------------------------------------------------------------------------
-- 💬 send_chat_message - Envía mensaje con detección anti-bypass
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION send_chat_message(
    order_id_param UUID,
    message_text_param TEXT,
    sender_role_param TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    order_record public.orders%ROWTYPE;
    sender_id_val UUID;
    receiver_id_val UUID;
    user_role_val user_role;
    has_phone BOOLEAN := false;
    has_email BOOLEAN := false;
    is_blocked_val BOOLEAN := false;
    message_id UUID;
    phone_pattern TEXT := '\+?[0-9]{1,4}[\s\-]?[0-9]{1,4}[\s\-]?[0-9]{4,10}';
    email_pattern TEXT := '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}';
    result JSONB;
BEGIN
    -- Validar usuario autenticado
    sender_id_val := auth.uid();
    IF sender_id_val IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Obtener rol del usuario
    SELECT role INTO user_role_val
    FROM public.profiles
    WHERE id = sender_id_val;
    
    -- Si se proporciona sender_role_param, validar que coincida
    IF sender_role_param IS NOT NULL AND user_role_val::TEXT != sender_role_param THEN
        RAISE EXCEPTION 'El rol del usuario no coincide con el rol proporcionado';
    END IF;
    
    -- Obtener información del pedido
    SELECT * INTO order_record
    FROM public.orders
    WHERE id = order_id_param;
    
    -- Validar que el pedido existe
    IF order_record.id IS NULL THEN
        RAISE EXCEPTION 'Pedido no encontrado';
    END IF;
    
    -- Determinar receiver_id según el rol del sender
    IF user_role_val = 'cliente' THEN
        IF order_record.client_id != sender_id_val THEN
            RAISE EXCEPTION 'No tienes permiso para enviar mensajes en este pedido';
        END IF;
        receiver_id_val := order_record.producer_id;
        
    ELSIF user_role_val = 'productor' THEN
        IF order_record.producer_id != sender_id_val THEN
            RAISE EXCEPTION 'No tienes permiso para enviar mensajes en este pedido';
        END IF;
        receiver_id_val := order_record.client_id;
        
    ELSIF user_role_val = 'repartidor' THEN
        -- Repartidores pueden enviar mensajes a ambos
        -- Por defecto, enviar al cliente
        receiver_id_val := order_record.client_id;
        
    ELSE
        RAISE EXCEPTION 'Rol no autorizado para enviar mensajes';
    END IF;
    
    -- Detectar números de teléfono en el mensaje
    IF message_text_param ~* phone_pattern THEN
        has_phone := true;
        is_blocked_val := true;
    END IF;
    
    -- Detectar emails en el mensaje
    IF message_text_param ~* email_pattern THEN
        has_email := true;
        is_blocked_val := true;
    END IF;
    
    -- Si el mensaje está bloqueado, registrar intento de bypass
    IF is_blocked_val THEN
        -- Registrar en logs (si existe tabla de logs de bypass)
        -- Por ahora, solo marcamos el mensaje como bloqueado
        RAISE WARNING 'Intento de bypass detectado: usuario % intentó enviar información de contacto en pedido %', 
            sender_id_val, order_id_param;
    END IF;
    
    -- Insertar mensaje (aunque esté bloqueado, lo guardamos para auditoría)
    INSERT INTO public.chat_messages (
        order_id,
        sender_id,
        receiver_id,
        message_text,
        has_phone_number,
        has_email,
        is_blocked
    ) VALUES (
        order_id_param,
        sender_id_val,
        receiver_id_val,
        message_text_param,
        has_phone,
        has_email,
        is_blocked_val
    ) RETURNING id INTO message_id;
    
    -- Construir respuesta
    IF is_blocked_val THEN
        result := jsonb_build_object(
            'success', false,
            'message_id', message_id,
            'blocked', true,
            'reason', CASE 
                WHEN has_phone THEN 'El mensaje contiene un número de teléfono. Por favor, usa el chat interno para comunicarte.'
                WHEN has_email THEN 'El mensaje contiene un email. Por favor, usa el chat interno para comunicarte.'
                ELSE 'El mensaje contiene información de contacto no permitida.'
            END
        );
    ELSE
        result := jsonb_build_object(
            'success', true,
            'message_id', message_id,
            'blocked', false,
            'message', 'Mensaje enviado correctamente'
        );
    END IF;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION send_chat_message(UUID, TEXT, TEXT) IS 'Envía un mensaje de chat con detección automática de números de teléfono y emails. Bloquea mensajes que contengan información de contacto.';

-- ----------------------------------------------------------------------------
-- 🛒 create_order - Crea nuevo pedido con validaciones
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_order(
    client_id_param UUID,
    producer_id_param UUID,
    items_param JSONB,
    delivery_address_param TEXT DEFAULT NULL,
    delivery_address_point_param GEOMETRY DEFAULT NULL,
    pickup_time_param TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    order_id_val UUID;
    item JSONB;
    dish_record public.dishes%ROWTYPE;
    subtotal_cents_val INTEGER := 0;
    commission_rate DECIMAL(5,4) := 0.15;
    commission_cents_val INTEGER;
    total_cents_val INTEGER;
    item_count INTEGER;
    order_record public.orders%ROWTYPE;
    result JSONB;
BEGIN
    -- Validar usuario autenticado
    IF client_id_param != auth.uid() THEN
        RAISE EXCEPTION 'Solo puedes crear pedidos para tu propia cuenta';
    END IF;
    
    -- Validar que el cliente existe y tiene rol correcto
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = client_id_param AND role = 'cliente') THEN
        RAISE EXCEPTION 'El usuario no es un cliente válido';
    END IF;
    
    -- Validar que el productor existe y está activo
    IF NOT EXISTS (SELECT 1 FROM producers WHERE id = producer_id_param AND is_active = true) THEN
        RAISE EXCEPTION 'El productor no existe o no está activo';
    END IF;
    
    -- Validar que items_param es un array
    IF jsonb_typeof(items_param) != 'array' THEN
        RAISE EXCEPTION 'Los items deben ser un array JSON';
    END IF;
    
    -- Validar que hay al menos un item
    item_count := jsonb_array_length(items_param);
    IF item_count = 0 THEN
        RAISE EXCEPTION 'El pedido debe tener al menos un item';
    END IF;
    
    -- Validar y calcular totales para cada item
    FOR item IN SELECT * FROM jsonb_array_elements(items_param)
    LOOP
        -- Validar que el item tiene dish_id y quantity
        IF NOT (item ? 'dish_id' AND item ? 'quantity') THEN
            RAISE EXCEPTION 'Cada item debe tener dish_id y quantity';
        END IF;
        
        -- Obtener información del plato
        SELECT * INTO dish_record
        FROM public.dishes
        WHERE id = (item->>'dish_id')::UUID
          AND producer_id = producer_id_param
          AND is_available = true;
        
        -- Validar que el plato existe y está disponible
        IF dish_record.id IS NULL THEN
            RAISE EXCEPTION 'El plato % no existe, no está disponible o no pertenece a este productor', 
                item->>'dish_id';
        END IF;
        
        -- Validar cantidad
        IF (item->>'quantity')::INTEGER <= 0 THEN
            RAISE EXCEPTION 'La cantidad debe ser mayor a 0';
        END IF;
        
        -- Calcular subtotal
        subtotal_cents_val := subtotal_cents_val + (dish_record.price_cents * (item->>'quantity')::INTEGER);
    END LOOP;
    
    -- Calcular comisión (15%)
    commission_cents_val := FLOOR(subtotal_cents_val * commission_rate);
    
    -- Calcular total
    total_cents_val := subtotal_cents_val + commission_cents_val;
    
    -- Si no se proporciona pickup_time, usar 2 horas desde ahora por defecto
    IF pickup_time_param IS NULL THEN
        pickup_time_param := NOW() + INTERVAL '2 hours';
    END IF;
    
    -- Validar que pickup_time es en el futuro
    IF pickup_time_param <= NOW() THEN
        RAISE EXCEPTION 'La hora de retiro debe ser en el futuro';
    END IF;
    
    -- Crear el pedido
    INSERT INTO public.orders (
        client_id,
        producer_id,
        status,
        delivery_address,
        delivery_address_point,
        pickup_time,
        subtotal_cents,
        commission_cents,
        total_cents
    ) VALUES (
        client_id_param,
        producer_id_param,
        'pending',
        delivery_address_param,
        delivery_address_point_param,
        pickup_time_param,
        subtotal_cents_val,
        commission_cents_val,
        total_cents_val
    ) RETURNING * INTO order_record;
    
    order_id_val := order_record.id;
    
    -- Crear order_items
    FOR item IN SELECT * FROM jsonb_array_elements(items_param)
    LOOP
        SELECT * INTO dish_record
        FROM public.dishes
        WHERE id = (item->>'dish_id')::UUID;
        
        INSERT INTO public.order_items (
            order_id,
            dish_id,
            quantity,
            price_cents
        ) VALUES (
            order_id_val,
            dish_record.id,
            (item->>'quantity')::INTEGER,
            dish_record.price_cents
        );
    END LOOP;
    
    -- Construir respuesta
    result := jsonb_build_object(
        'success', true,
        'order_id', order_id_val,
        'order', jsonb_build_object(
            'id', order_id_val,
            'status', order_record.status,
            'subtotal_cents', subtotal_cents_val,
            'commission_cents', commission_cents_val,
            'total_cents', total_cents_val,
            'pickup_time', pickup_time_param,
            'created_at', order_record.created_at
        ),
        'message', 'Pedido creado correctamente. Procede al pago para confirmarlo.'
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_order(UUID, UUID, JSONB, TEXT, GEOMETRY, TIMESTAMPTZ) IS 'Crea un nuevo pedido con validaciones de disponibilidad, cálculo de comisiones (15%) y aplicación de políticas anti-bypass.';

-- ----------------------------------------------------------------------------
-- 💰 process_mercadopago_webhook - Procesa webhook de Mercado Pago
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_mercadopago_webhook(
    payment_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    mp_payment_id TEXT;
    order_id_val UUID;
    payment_status_val payment_status;
    amount_cents_val INTEGER;
    order_record public.orders%ROWTYPE;
    payment_record public.payments%ROWTYPE;
    time_until_pickup INTERVAL;
    result JSONB;
BEGIN
    -- Validar que payment_data tiene la estructura esperada
    IF NOT (payment_data ? 'id' AND payment_data ? 'status' AND payment_data ? 'transaction_amount') THEN
        RAISE EXCEPTION 'Datos de pago inválidos: faltan campos requeridos';
    END IF;
    
    -- Extraer información del pago
    mp_payment_id := payment_data->>'id';
    payment_status_val := (payment_data->>'status')::payment_status;
    amount_cents_val := FLOOR((payment_data->>'transaction_amount')::DECIMAL * 100);
    
    -- Buscar pago existente por mercado_pago_payment_id
    SELECT * INTO payment_record
    FROM public.payments
    WHERE mercado_pago_payment_id = mp_payment_id;
    
    -- Si el pago no existe, buscar por order_id en el webhook
    IF payment_record.id IS NULL AND payment_data ? 'external_reference' THEN
        order_id_val := (payment_data->>'external_reference')::UUID;
        
        -- Buscar pago por order_id
        SELECT * INTO payment_record
        FROM public.payments
        WHERE order_id = order_id_val
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;
    
    -- Si aún no existe, crear nuevo registro de pago
    IF payment_record.id IS NULL THEN
        IF order_id_val IS NULL THEN
            RAISE EXCEPTION 'No se pudo determinar el order_id del pago';
        END IF;
        
        -- Obtener información del pedido
        SELECT * INTO order_record
        FROM public.orders
        WHERE id = order_id_val;
        
        IF order_record.id IS NULL THEN
            RAISE EXCEPTION 'Pedido no encontrado para el pago';
        END IF;
        
        -- Crear registro de pago
        INSERT INTO payments (
            order_id,
            mercado_pago_payment_id,
            status,
            amount_cents,
            currency,
            payment_method,
            mercado_pago_response
        ) VALUES (
            order_id_val,
            mp_payment_id,
            payment_status_val,
            amount_cents_val,
            COALESCE(payment_data->>'currency', 'ARS'),
            payment_data->>'payment_method_id',
            payment_data
        ) RETURNING * INTO payment_record;
    ELSE
        -- Actualizar pago existente
        UPDATE public.payments
        SET 
            status = payment_status_val,
            amount_cents = amount_cents_val,
            updated_at = NOW(),
            mercado_pago_response = payment_data
        WHERE id = payment_record.id
        RETURNING * INTO payment_record;
        
        order_id_val := payment_record.order_id;
    END IF;
    
    -- Si el pago fue aprobado, actualizar el pedido
    IF payment_status_val = 'approved' AND payment_record.status != 'approved' THEN
        -- Obtener información del pedido
        SELECT * INTO order_record
        FROM public.orders
        WHERE id = order_id_val;
        
        -- Actualizar pedido
        UPDATE public.orders
        SET 
            paid_at = NOW(),
            status = 'confirmed'
        WHERE id = order_id_val
        RETURNING * INTO order_record;
        
        -- Verificar si podemos revelar la dirección automáticamente
        IF order_record.pickup_time IS NOT NULL THEN
            time_until_pickup := order_record.pickup_time - NOW();
            
            -- Si faltan 30 minutos o menos, revelar dirección
            IF time_until_pickup <= INTERVAL '30 minutes' AND time_until_pickup >= INTERVAL '0 minutes' THEN
                UPDATE public.orders
                SET address_revealed_at = NOW()
                WHERE id = order_id_val;
            END IF;
        END IF;
    END IF;
    
    -- Construir respuesta
    result := jsonb_build_object(
        'success', true,
        'payment_id', payment_record.id,
        'order_id', order_id_val,
        'status', payment_status_val,
        'message', CASE payment_status_val
            WHEN 'approved' THEN 'Pago aprobado. El pedido ha sido confirmado.'
            WHEN 'rejected' THEN 'Pago rechazado.'
            WHEN 'refunded' THEN 'Pago reembolsado.'
            ELSE 'Estado de pago actualizado.'
        END
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_mercadopago_webhook(JSONB) IS 'Procesa webhooks de Mercado Pago, actualiza estados de pago y revela direcciones automáticamente si el pago es aprobado y está dentro de la ventana de tiempo.';

-- ----------------------------------------------------------------------------
-- 📊 get_producer_dashboard - Dashboard "modo abuela" para productores
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_producer_dashboard(
    producer_id_param UUID DEFAULT auth.uid(),
    date_range_param TEXT DEFAULT 'today'
)
RETURNS JSONB AS $$
DECLARE
    start_date TIMESTAMPTZ;
    end_date TIMESTAMPTZ;
    orders_today INTEGER;
    orders_week INTEGER;
    revenue_today_cents INTEGER;
    revenue_week_cents INTEGER;
    net_revenue_today_cents INTEGER;
    net_revenue_week_cents INTEGER;
    avg_rating DECIMAL;
    total_orders INTEGER;
    top_dishes JSONB;
    recent_orders JSONB;
    result JSONB;
BEGIN
    -- Validar que el usuario es el productor
    IF producer_id_param != auth.uid() THEN
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
            RAISE EXCEPTION 'Solo puedes ver tu propio dashboard';
        END IF;
    END IF;
    
    -- Calcular fechas según date_range
    CASE date_range_param
        WHEN 'today' THEN
            start_date := date_trunc('day', NOW());
            end_date := NOW();
        WHEN 'week' THEN
            start_date := date_trunc('week', NOW());
            end_date := NOW();
        WHEN 'month' THEN
            start_date := date_trunc('month', NOW());
            end_date := NOW();
        ELSE
            start_date := date_trunc('day', NOW());
            end_date := NOW();
    END CASE;
    
    -- Pedidos de hoy
    SELECT COUNT(*) INTO orders_today
    FROM public.orders
    WHERE producer_id = producer_id_param
      AND created_at >= date_trunc('day', NOW())
      AND created_at <= NOW();
    
    -- Pedidos de la semana
    SELECT COUNT(*) INTO orders_week
    FROM public.orders
    WHERE producer_id = producer_id_param
      AND created_at >= date_trunc('week', NOW())
      AND created_at <= NOW();
    
    -- Ingresos de hoy (después de comisiones)
    SELECT COALESCE(SUM(subtotal_cents - commission_cents), 0) INTO net_revenue_today_cents
    FROM public.orders
    WHERE producer_id = producer_id_param
      AND paid_at >= date_trunc('day', NOW())
      AND paid_at <= NOW()
      AND status IN ('confirmed', 'preparing', 'ready', 'delivered');
    
    -- Ingresos de la semana (después de comisiones)
    SELECT COALESCE(SUM(subtotal_cents - commission_cents), 0) INTO net_revenue_week_cents
    FROM public.orders
    WHERE producer_id = producer_id_param
      AND paid_at >= date_trunc('week', NOW())
      AND paid_at <= NOW()
      AND status IN ('confirmed', 'preparing', 'ready', 'delivered');
    
    -- Ingresos brutos de hoy
    SELECT COALESCE(SUM(subtotal_cents), 0) INTO revenue_today_cents
    FROM public.orders
    WHERE producer_id = producer_id_param
      AND paid_at >= date_trunc('day', NOW())
      AND paid_at <= NOW()
      AND status IN ('confirmed', 'preparing', 'ready', 'delivered');
    
    -- Ingresos brutos de la semana
    SELECT COALESCE(SUM(subtotal_cents), 0) INTO revenue_week_cents
    FROM public.orders
    WHERE producer_id = producer_id_param
      AND paid_at >= date_trunc('week', NOW())
      AND paid_at <= NOW()
      AND status IN ('confirmed', 'preparing', 'ready', 'delivered');
    
    -- Rating promedio
    SELECT rating INTO avg_rating
    FROM public.producers
    WHERE id = producer_id_param;
    
    -- Total de pedidos
    SELECT total_orders INTO total_orders
    FROM public.producers
    WHERE id = producer_id_param;
    
    -- Top 5 platos más vendidos
    SELECT jsonb_agg(
        jsonb_build_object(
            'dish_id', dish_id,
            'dish_name', dish_name,
            'total_quantity', total_quantity,
            'revenue_cents', revenue_cents
        ) ORDER BY total_quantity DESC
    ) INTO top_dishes
    FROM (
        SELECT 
            d.id AS dish_id,
            d.name AS dish_name,
            SUM(oi.quantity) AS total_quantity,
            SUM(oi.quantity * oi.price_cents) AS revenue_cents
        FROM order_items oi
        INNER JOIN dishes d ON oi.dish_id = d.id
        INNER JOIN orders o ON oi.order_id = o.id
        WHERE o.producer_id = producer_id_param
          AND o.paid_at >= start_date
          AND o.paid_at <= end_date
          AND o.status IN ('confirmed', 'preparing', 'ready', 'delivered')
        GROUP BY d.id, d.name
        ORDER BY total_quantity DESC
        LIMIT 5
    ) top_dishes_subquery;
    
    -- Pedidos recientes (últimos 10)
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'client_id', client_id,
            'status', status,
            'total_cents', total_cents,
            'created_at', created_at,
            'paid_at', paid_at
        ) ORDER BY created_at DESC
    ) INTO recent_orders
    FROM (
        SELECT 
            id,
            client_id,
            status,
            total_cents,
            created_at,
            paid_at
        FROM public.orders
        WHERE producer_id = producer_id_param
        ORDER BY created_at DESC
        LIMIT 10
    ) recent_orders_subquery;
    
    -- Construir respuesta
    result := jsonb_build_object(
        'success', true,
        'producer_id', producer_id_param,
        'date_range', date_range_param,
        'stats', jsonb_build_object(
            'orders_today', orders_today,
            'orders_week', orders_week,
            'total_orders', total_orders,
            'revenue_today_cents', revenue_today_cents,
            'revenue_week_cents', revenue_week_cents,
            'net_revenue_today_cents', net_revenue_today_cents,
            'net_revenue_week_cents', net_revenue_week_cents,
            'avg_rating', avg_rating
        ),
        'top_dishes', COALESCE(top_dishes, '[]'::jsonb),
        'recent_orders', COALESCE(recent_orders, '[]'::jsonb)
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_producer_dashboard(UUID, TEXT) IS 'Retorna métricas del dashboard para productores: pedidos, ingresos netos (después de comisiones), platos más vendidos y pedidos recientes.';

-- ============================================================================
-- 2. TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ⏰ auto_reveal_address_30min_before - Revela dirección automáticamente
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_reveal_address_30min_before()
RETURNS TRIGGER AS $$
DECLARE
    time_until_pickup INTERVAL;
BEGIN
    -- Solo procesar si el estado cambió a 'preparing' o 'ready'
    IF NEW.status IN ('preparing', 'ready') 
       AND (OLD.status IS NULL OR OLD.status != NEW.status)
       AND NEW.paid_at IS NOT NULL
       AND NEW.pickup_time IS NOT NULL
       AND NEW.address_revealed_at IS NULL THEN
        
        -- Calcular tiempo hasta el retiro
        time_until_pickup := NEW.pickup_time - NOW();
        
        -- Si faltan 30 minutos o menos, revelar dirección
        IF time_until_pickup <= INTERVAL '30 minutes' AND time_until_pickup >= INTERVAL '0 minutes' THEN
            NEW.address_revealed_at := NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_auto_reveal_address ON public.orders;
CREATE TRIGGER trigger_auto_reveal_address
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION auto_reveal_address_30min_before();

COMMENT ON FUNCTION auto_reveal_address_30min_before() IS 'Trigger que revela automáticamente la dirección cuando el pedido cambia a estado preparing o ready y faltan 30 minutos o menos para el retiro.';

-- ----------------------------------------------------------------------------
-- 📝 update_updated_at_timestamp - Actualiza updated_at automáticamente
-- ----------------------------------------------------------------------------
-- Esta función ya existe en el schema, pero la mejoramos para todas las tablas

CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas que tienen updated_at
-- (Ya están creados en el schema inicial, pero los documentamos aquí)

COMMENT ON FUNCTION update_updated_at_timestamp() IS 'Actualiza automáticamente el campo updated_at cuando se modifica un registro.';

-- ----------------------------------------------------------------------------
-- 🔒 detect_phone_in_chat - Detecta y bloquea números en chat (mejorado)
-- ----------------------------------------------------------------------------
-- Esta función ya existe en el schema, pero la mejoramos

CREATE OR REPLACE FUNCTION detect_phone_in_chat()
RETURNS TRIGGER AS $$
DECLARE
    phone_pattern TEXT := '\+?[0-9]{1,4}[\s\-]?[0-9]{1,4}[\s\-]?[0-9]{4,10}';
    email_pattern TEXT := '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}';
BEGIN
    -- Detectar números de teléfono
    IF NEW.message_text ~* phone_pattern THEN
        NEW.has_phone_number := true;
        NEW.is_blocked := true;
    END IF;
    
    -- Detectar emails
    IF NEW.message_text ~* email_pattern THEN
        NEW.has_email := true;
        NEW.is_blocked := true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- El trigger ya está creado en el schema inicial
COMMENT ON FUNCTION detect_phone_in_chat() IS 'Detecta automáticamente números de teléfono y emails en mensajes de chat y los bloquea para prevenir bypass.';

-- ----------------------------------------------------------------------------
-- 🚫 prevent_direct_contact_attempts - Registra intentos de bypass
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_direct_contact_attempts()
RETURNS TRIGGER AS $$
DECLARE
    order_record public.orders%ROWTYPE;
BEGIN
    -- Solo procesar si el mensaje está bloqueado
    IF NEW.is_blocked = true THEN
        -- Obtener información del pedido
        SELECT * INTO order_record
        FROM public.orders
        WHERE id = NEW.order_id;
        
        -- Registrar intento de bypass en logs (si existe tabla de auditoría)
        -- Por ahora, solo logueamos con RAISE WARNING
        RAISE WARNING 'Intento de bypass detectado: Usuario % intentó enviar información de contacto en pedido %. Mensaje bloqueado.', 
            NEW.sender_id, NEW.order_id;
        
        -- En producción, aquí se podría insertar en una tabla de auditoría
        -- INSERT INTO bypass_attempts_logs (user_id, order_id, message_id, detected_type, timestamp)
        -- VALUES (NEW.sender_id, NEW.order_id, NEW.id, 
        --         CASE WHEN NEW.has_phone_number THEN 'phone' ELSE 'email' END, NOW());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_prevent_direct_contact ON public.chat_messages;
CREATE TRIGGER trigger_prevent_direct_contact
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    WHEN (NEW.is_blocked = true)
    EXECUTE FUNCTION prevent_direct_contact_attempts();

COMMENT ON FUNCTION prevent_direct_contact_attempts() IS 'Registra intentos de bypass detectados en el chat para auditoría y monitoreo.';

-- ============================================================================
-- 3. GRANTS Y PERMISSIONS
-- ============================================================================

-- Permitir que usuarios autenticados ejecuten las funciones RPC
GRANT EXECUTE ON FUNCTION reveal_producer_contact(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mask_phone_number(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION send_chat_message(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_order(UUID, UUID, JSONB, TEXT, GEOMETRY, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_producer_dashboard(UUID, TEXT) TO authenticated;

-- Solo service role puede procesar webhooks de Mercado Pago
GRANT EXECUTE ON FUNCTION process_mercadopago_webhook(JSONB) TO service_role;

-- ============================================================================
-- FIN DE FUNCIONES RPC Y TRIGGERS
-- ============================================================================

-- NOTAS IMPORTANTES PARA IMPLEMENTACIÓN:
--
-- 1. INTEGRACIÓN CON TWILIO:
--    - La función mask_phone_number() debe integrarse con Twilio Proxy
--    - En producción, consultar phone_masking_logs para obtener números proxy
--    - Los números reales NUNCA se exponen directamente
--
-- 2. WEBHOOKS DE MERCADO PAGO:
--    - La función process_mercadopago_webhook() debe ser llamada desde un endpoint seguro
--    - Solo el service_role puede ejecutarla
--    - Validar la firma del webhook antes de procesarlo
--
-- 3. DASHBOARD DE PRODUCTORES:
--    - La función get_producer_dashboard() está optimizada para "modo abuela"
--    - Muestra métricas simples y claras
--    - Los montos están en centavos (convertir a pesos en el frontend)
--
-- 4. DETECCIÓN DE BYPASS:
--    - Los triggers detectan automáticamente intentos de compartir contacto
--    - Los mensajes bloqueados se guardan para auditoría
--    - Considerar crear tabla de logs de bypass para análisis
--
-- 5. TESTING:
--    - Probar todas las funciones con diferentes roles
--    - Verificar que las validaciones anti-bypass funcionan correctamente
--    - Validar cálculos de comisiones y totales
--    - Probar triggers con diferentes escenarios

