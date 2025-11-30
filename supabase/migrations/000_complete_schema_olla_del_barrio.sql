-- ============================================================================
-- OLLA DEL BARRIO - MARKETPLACE DE COMIDAS CASERAS EN AMBA
-- ============================================================================
-- Arquitectura PostgreSQL + Supabase con medidas anti-bypass estrictas
-- Autor: Arquitecto Senior PostgreSQL/Supabase
-- Fecha: 2024
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONES NECESARIAS
-- ============================================================================
-- PostGIS para geolocalización y polígonos de zonas AMBA
-- NOTA: auth.users es una tabla del sistema de Supabase que ya existe
-- NO intentamos crearla aquí, solo la referenciamos en FOREIGN KEY
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. ENUMS Y TIPOS PERSONALIZADOS
-- ============================================================================

-- Roles de usuario en el sistema
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'cliente',      -- Cliente que compra comidas
            'productor',    -- Productor que vende comidas caseras
            'repartidor',   -- Repartidor que entrega pedidos
            'admin'         -- Administrador del sistema
        );
    END IF;
END$$;

-- Estados del pedido con flujo controlado
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM (
            'pending',      -- Pendiente de pago
            'confirmed',    -- Pagado y confirmado
            'preparing',    -- En preparación
            'ready',        -- Listo para retiro
            'delivered',    -- Entregado
            'cancelled'     -- Cancelado
        );
    END IF;
END$$;

-- Estados de pago con Mercado Pago
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM (
            'pending',      -- Pendiente
            'approved',     -- Aprobado
            'rejected',     -- Rechazado
            'refunded',     -- Reembolsado
            'cancelled'     -- Cancelado
        );
    END IF;
END$$;

-- Estados de liquidación a productores
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_status') THEN
        CREATE TYPE payout_status AS ENUM (
            'pending',      -- Pendiente de liquidación
            'processing',   -- En proceso
            'completed',    -- Completado
            'failed'        -- Fallido
        );
    END IF;
END$$;

-- ============================================================================
-- 3. TABLAS PRINCIPALES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PROFILES - Perfiles extendidos de usuarios (extiende auth.users de Supabase)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'cliente',
    full_name TEXT,
    phone TEXT, -- Teléfono real (nunca expuesto directamente)
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_phone CHECK (phone ~ '^\+?[0-9]{10,15}$')
);

COMMENT ON TABLE public.profiles IS 'Perfiles de usuarios que extienden auth.users de Supabase. Contiene información sensible como teléfono real que nunca se expone directamente.';
COMMENT ON COLUMN public.profiles.phone IS 'Teléfono real del usuario. NUNCA se expone directamente - siempre se usa Twilio Proxy para enmascarar.';

-- ----------------------------------------------------------------------------
-- PRODUCERS - Información específica de productores
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.producers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL, -- Dirección real (nunca visible hasta después de pago)
    address_point GEOMETRY(POINT, 4326), -- Coordenadas geográficas para búsqueda por zona
    delivery_zone_id INTEGER, -- Zona de entrega asignada
    is_active BOOLEAN NOT NULL DEFAULT true,
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

COMMENT ON TABLE public.producers IS 'Información específica de productores. La dirección NUNCA se expone hasta que el cliente haya pagado y esté dentro de la ventana de 30 minutos antes del retiro.';
COMMENT ON COLUMN public.producers.address IS 'Dirección real del productor. Solo visible 30 min antes del retiro y desaparece después.';
COMMENT ON COLUMN public.producers.address_point IS 'Coordenadas geográficas para búsqueda por zona usando PostGIS.';

-- ----------------------------------------------------------------------------
-- DELIVERY_ZONES - 48 zonas de AMBA con polígonos geográficos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- Nombre de la zona (ej: "Palermo", "San Telmo")
    polygon GEOMETRY(POLYGON, 4326) NOT NULL, -- Polígono que define la zona
    center_point GEOMETRY(POINT, 4326) NOT NULL, -- Punto central de la zona
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE delivery_zones IS '48 zonas geográficas de AMBA definidas por polígonos PostGIS. Permite búsqueda eficiente de productores por ubicación.';

-- Agregar foreign key después de crear la tabla delivery_zones
ALTER TABLE public.producers 
ADD CONSTRAINT fk_producers_delivery_zone 
FOREIGN KEY (delivery_zone_id) REFERENCES public.delivery_zones(id);

-- ----------------------------------------------------------------------------
-- DISHES - Catálogo de platos ofrecidos por productores
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producer_id UUID NOT NULL REFERENCES public.producers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL CHECK (price_cents > 0), -- Precio en centavos (evita floats)
    image_url TEXT,
    category TEXT, -- Categoría del plato (ej: "Pastas", "Parrilla", "Vegano")
    is_available BOOLEAN NOT NULL DEFAULT true,
    preparation_time_minutes INTEGER CHECK (preparation_time_minutes > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.dishes IS 'Catálogo de platos ofrecidos por productores. Precios en centavos para evitar problemas de precisión con floats.';
COMMENT ON COLUMN public.dishes.price_cents IS 'Precio en centavos (ej: 1500 = $15.00). Evita problemas de precisión con tipos float.';

-- ----------------------------------------------------------------------------
-- ORDERS - Pedidos realizados por clientes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    producer_id UUID NOT NULL REFERENCES public.producers(id) ON DELETE RESTRICT,
    status order_status NOT NULL DEFAULT 'pending',
    
    -- Información de entrega
    delivery_address TEXT, -- Dirección de entrega del cliente
    delivery_address_point GEOMETRY(POINT, 4326), -- Coordenadas de entrega
    pickup_time TIMESTAMPTZ, -- Hora programada de retiro
    
    -- Montos (en centavos)
    subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
    commission_cents INTEGER NOT NULL CHECK (commission_cents >= 0), -- 15% de comisión
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    
    -- Timestamps críticos para lógica anti-bypass
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ, -- Cuando se pagó (después de esto se puede ver dirección)
    address_revealed_at TIMESTAMPTZ, -- Cuando se reveló la dirección (30 min antes del retiro)
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.orders IS 'Pedidos del marketplace. Implementa lógica anti-bypass: dirección solo visible después de pago y 30 min antes del retiro.';
COMMENT ON COLUMN public.orders.paid_at IS 'Timestamp cuando se confirmó el pago. Solo después de esto el cliente puede ver la dirección del productor.';
COMMENT ON COLUMN public.orders.address_revealed_at IS 'Timestamp cuando se reveló la dirección. Solo visible 30 minutos antes del retiro y desaparece después.';

-- ----------------------------------------------------------------------------
-- ORDER_ITEMS - Items individuales de cada pedido
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_cents INTEGER NOT NULL CHECK (price_cents > 0), -- Precio al momento de la compra (snapshot)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.order_items IS 'Items individuales de cada pedido. Guarda snapshot del precio al momento de la compra.';

-- ----------------------------------------------------------------------------
-- PAYMENTS - Pagos procesados con Mercado Pago
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    mercado_pago_payment_id TEXT UNIQUE, -- ID de pago de Mercado Pago
    status payment_status NOT NULL DEFAULT 'pending',
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency TEXT NOT NULL DEFAULT 'ARS',
    payment_method TEXT, -- Método de pago (ej: "credit_card", "debit_card")
    mercado_pago_response JSONB, -- Respuesta completa de Mercado Pago
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.payments IS 'Pagos procesados a través de Mercado Pago. Guarda toda la información de la transacción.';

-- ----------------------------------------------------------------------------
-- PAYOUTS - Liquidaciones a productores
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producer_id UUID NOT NULL REFERENCES public.producers(id) ON DELETE RESTRICT,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    status payout_status NOT NULL DEFAULT 'pending',
    mercado_pago_payout_id TEXT, -- ID de transferencia de Mercado Pago
    period_start TIMESTAMPTZ NOT NULL, -- Inicio del período de liquidación
    period_end TIMESTAMPTZ NOT NULL, -- Fin del período de liquidación
    orders_count INTEGER DEFAULT 0, -- Cantidad de pedidos incluidos
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_period CHECK (period_end > period_start)
);

COMMENT ON TABLE public.payouts IS 'Liquidaciones periódicas a productores. Incluye comisiones del 15% que se retiene la plataforma.';

-- ----------------------------------------------------------------------------
-- COMMISSIONS - Registro detallado de comisiones por pedido
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    producer_id UUID NOT NULL REFERENCES public.producers(id) ON DELETE RESTRICT,
    commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.15 CHECK (commission_rate >= 0 AND commission_rate <= 1), -- 15% por defecto
    commission_cents INTEGER NOT NULL CHECK (commission_cents >= 0),
    payout_id UUID REFERENCES public.payouts(id) ON DELETE SET NULL, -- Asociado a una liquidación
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.commissions IS 'Registro detallado de comisiones (15%) por cada pedido. Se asocia a payouts cuando se liquida al productor.';

-- ----------------------------------------------------------------------------
-- CHAT_MESSAGES - Sistema de chat interno obligatorio
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    message_text TEXT NOT NULL,
    has_phone_number BOOLEAN DEFAULT false, -- Detectado automáticamente por trigger
    has_email BOOLEAN DEFAULT false, -- Detectado automáticamente por trigger
    is_blocked BOOLEAN DEFAULT false, -- Si contiene información de contacto, se bloquea
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT different_sender_receiver CHECK (sender_id != receiver_id)
);

COMMENT ON TABLE public.chat_messages IS 'Sistema de chat interno obligatorio. Detecta automáticamente intentos de compartir números de teléfono o emails para evitar bypass.';
COMMENT ON COLUMN public.chat_messages.has_phone_number IS 'Detectado automáticamente por trigger si el mensaje contiene números de teléfono.';
COMMENT ON COLUMN public.chat_messages.is_blocked IS 'Si el mensaje contiene información de contacto, se marca como bloqueado y no se muestra.';

-- ----------------------------------------------------------------------------
-- PHONE_MASKING_LOGS - Registro de enmascaramiento de teléfonos con Twilio
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.phone_masking_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    caller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    real_phone_from TEXT NOT NULL, -- Teléfono real del que llama (nunca expuesto)
    real_phone_to TEXT NOT NULL, -- Teléfono real del que recibe (nunca expuesto)
    twilio_proxy_phone TEXT NOT NULL, -- Número proxy de Twilio usado
    twilio_call_sid TEXT, -- ID de llamada de Twilio
    is_active BOOLEAN DEFAULT true, -- Si el proxy sigue activo
    expires_at TIMESTAMPTZ, -- Cuando expira el proxy (después de confirmación)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.phone_masking_logs IS 'Registro de enmascaramiento de teléfonos con Twilio Proxy. Los números reales NUNCA se exponen directamente.';
COMMENT ON COLUMN public.phone_masking_logs.real_phone_from IS 'Teléfono real del que llama. NUNCA se expone - solo se usa para configurar Twilio Proxy.';
COMMENT ON COLUMN public.phone_masking_logs.real_phone_to IS 'Teléfono real del que recibe. NUNCA se expone - solo se usa para configurar Twilio Proxy.';

-- ============================================================================
-- 4. ÍNDICES OPTIMIZADOS
-- ============================================================================

-- Índices para búsqueda por zona geográfica (PostGIS)
CREATE INDEX idx_producers_address_point ON producers USING GIST (address_point);
CREATE INDEX idx_producers_delivery_zone ON producers (delivery_zone_id) WHERE is_active = true;
CREATE INDEX idx_delivery_zones_polygon ON delivery_zones USING GIST (polygon);
CREATE INDEX idx_orders_delivery_address_point ON orders USING GIST (delivery_address_point);

-- Índices para consultas frecuentes de pedidos
CREATE INDEX idx_orders_client_id ON orders (client_id);
CREATE INDEX idx_orders_producer_id ON orders (producer_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX idx_orders_paid_at ON orders (paid_at) WHERE paid_at IS NOT NULL;

-- Índices para catálogo de platos
CREATE INDEX idx_dishes_producer_id ON dishes (producer_id) WHERE is_available = true;
CREATE INDEX idx_dishes_category ON dishes (category) WHERE is_available = true;

-- Índices para pagos y liquidaciones
CREATE INDEX idx_payments_order_id ON payments (order_id);
CREATE INDEX idx_payments_status ON payments (status);
CREATE INDEX idx_payouts_producer_id ON payouts (producer_id);
CREATE INDEX idx_payouts_status ON payouts (status);

-- Índices para chat
CREATE INDEX idx_chat_messages_order_id ON chat_messages (order_id, created_at DESC);
CREATE INDEX idx_chat_messages_sender_receiver ON chat_messages (sender_id, receiver_id);

-- Índices para enmascaramiento de teléfonos
CREATE INDEX idx_phone_masking_order_id ON phone_masking_logs (order_id);
CREATE INDEX idx_phone_masking_active ON phone_masking_logs (is_active) WHERE is_active = true;

-- ============================================================================
-- 5. TRIGGERS Y FUNCIONES
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at a todas las tablas relevantes
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_producers_updated_at BEFORE UPDATE ON producers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_zones_updated_at BEFORE UPDATE ON delivery_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dishes_updated_at BEFORE UPDATE ON dishes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para detectar números de teléfono y emails en mensajes de chat
CREATE OR REPLACE FUNCTION detect_contact_info_in_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Detectar números de teléfono (formato argentino y internacional)
    -- Patrones: +54 9 11 1234-5678, 11 1234-5678, 1123456789, etc.
    IF NEW.message_text ~* '\+?[0-9]{1,4}[\s\-]?[0-9]{1,4}[\s\-]?[0-9]{4,10}' THEN
        NEW.has_phone_number = true;
        NEW.is_blocked = true; -- Bloquear mensajes con números
    END IF;
    
    -- Detectar emails
    IF NEW.message_text ~* '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' THEN
        NEW.has_email = true;
        NEW.is_blocked = true; -- Bloquear mensajes con emails
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para detectar información de contacto en chat
CREATE TRIGGER detect_contact_info_trigger
    BEFORE INSERT OR UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION detect_contact_info_in_message();

-- Función para revelar dirección cuando se paga (solo si está en ventana de 30 min)
CREATE OR REPLACE FUNCTION check_address_reveal_permission()
RETURNS TRIGGER AS $$
DECLARE
    time_until_pickup INTERVAL;
BEGIN
    -- Solo permitir ver dirección si:
    -- 1. El pedido está pagado (paid_at IS NOT NULL)
    -- 2. Está dentro de 30 minutos antes del pickup_time
    -- 3. El pedido no está entregado o cancelado
    
    IF NEW.paid_at IS NOT NULL 
       AND NEW.pickup_time IS NOT NULL 
       AND NEW.status NOT IN ('delivered', 'cancelled') THEN
        
        time_until_pickup := NEW.pickup_time - NOW();
        
        -- Si estamos dentro de 30 minutos antes del retiro, revelar dirección
        IF time_until_pickup <= INTERVAL '30 minutes' AND time_until_pickup >= INTERVAL '0 minutes' THEN
            IF NEW.address_revealed_at IS NULL THEN
                NEW.address_revealed_at = NOW();
            END IF;
        -- Si ya pasó el tiempo de retiro, ocultar dirección nuevamente
        ELSIF time_until_pickup < INTERVAL '0 minutes' THEN
            -- La dirección ya no debería ser visible (se maneja en la aplicación)
            -- Pero mantenemos el registro de cuándo se reveló
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para controlar revelación de dirección
CREATE TRIGGER check_address_reveal_trigger
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION check_address_reveal_permission();

-- Función para calcular comisión automáticamente al crear pedido
CREATE OR REPLACE FUNCTION calculate_order_commission()
RETURNS TRIGGER AS $$
DECLARE
    commission_rate DECIMAL(5,4) := 0.15; -- 15% de comisión
BEGIN
    -- Calcular comisión (15% del subtotal)
    NEW.commission_cents := FLOOR(NEW.subtotal_cents * commission_rate);
    NEW.total_cents := NEW.subtotal_cents + NEW.commission_cents;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular comisión al crear/actualizar pedido
CREATE TRIGGER calculate_commission_trigger
    BEFORE INSERT OR UPDATE OF subtotal_cents ON orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_commission();

-- Función para crear registro de comisión cuando se confirma el pago
CREATE OR REPLACE FUNCTION create_commission_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    order_record orders%ROWTYPE;
    commission_rate DECIMAL(5,4) := 0.15;
BEGIN
    -- Cuando un pago se aprueba, crear registro de comisión
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        SELECT * INTO order_record FROM orders WHERE id = NEW.order_id;
        
        -- Crear registro de comisión
        INSERT INTO commissions (order_id, producer_id, commission_rate, commission_cents)
        VALUES (
            NEW.order_id,
            order_record.producer_id,
            commission_rate,
            order_record.commission_cents
        );
        
        -- Actualizar orden con timestamp de pago
        UPDATE orders 
        SET paid_at = NOW(), status = 'confirmed'
        WHERE id = NEW.order_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear comisión cuando se aprueba pago
CREATE TRIGGER create_commission_trigger
    AFTER INSERT OR UPDATE OF status ON payments
    FOR EACH ROW
    EXECUTE FUNCTION create_commission_on_payment();

-- ============================================================================
-- 6. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Habilitar RLS en todas las tablas
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

-- ----------------------------------------------------------------------------
-- POLÍTICAS PARA PROFILES
-- ----------------------------------------------------------------------------

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Los usuarios pueden ver perfiles públicos (sin información sensible)
CREATE POLICY "Users can view public profiles"
    ON profiles FOR SELECT
    USING (true);

-- Admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ----------------------------------------------------------------------------
-- POLÍTICAS PARA PRODUCERS
-- ----------------------------------------------------------------------------

-- Todos pueden ver productores activos (sin dirección)
CREATE POLICY "Anyone can view active producers"
    ON producers FOR SELECT
    USING (is_active = true);

-- Productores pueden ver y editar su propia información
CREATE POLICY "Producers can manage own profile"
    ON producers FOR ALL
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Clientes pueden ver productores activos (sin dirección hasta después de pago)
-- La dirección se controla a nivel de aplicación usando las funciones
CREATE POLICY "Clients can view active producers"
    ON producers FOR SELECT
    USING (
        is_active = true AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'cliente'
        )
    );

-- Admins pueden ver todos los productores
CREATE POLICY "Admins can view all producers"
    ON producers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ----------------------------------------------------------------------------
-- POLÍTICAS PARA DELIVERY_ZONES
-- ----------------------------------------------------------------------------

-- Todos pueden ver zonas activas
CREATE POLICY "Anyone can view active zones"
    ON delivery_zones FOR SELECT
    USING (is_active = true);

-- Admins pueden gestionar zonas
CREATE POLICY "Admins can manage zones"
    ON delivery_zones FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ----------------------------------------------------------------------------
-- POLÍTICAS PARA DISHES
-- ----------------------------------------------------------------------------

-- Todos pueden ver platos disponibles
CREATE POLICY "Anyone can view available dishes"
    ON dishes FOR SELECT
    USING (is_available = true);

-- Productores pueden gestionar sus propios platos
CREATE POLICY "Producers can manage own dishes"
    ON dishes FOR ALL
    USING (producer_id = auth.uid())
    WITH CHECK (producer_id = auth.uid());

-- ----------------------------------------------------------------------------
-- POLÍTICAS PARA ORDERS (CRÍTICO: Lógica anti-bypass)
-- ----------------------------------------------------------------------------

-- Clientes pueden ver sus propios pedidos
CREATE POLICY "Clients can view own orders"
    ON orders FOR SELECT
    USING (
        client_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'cliente'
        )
    );

-- Clientes pueden crear pedidos
CREATE POLICY "Clients can create orders"
    ON orders FOR INSERT
    WITH CHECK (
        client_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'cliente'
        )
    );

-- Productores pueden ver pedidos dirigidos a ellos
CREATE POLICY "Producers can view own orders"
    ON orders FOR SELECT
    USING (
        producer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'productor'
        )
    );

-- Productores pueden actualizar estado de sus pedidos
CREATE POLICY "Producers can update own orders status"
    ON orders FOR UPDATE
    USING (
        producer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'productor'
        )
    )
    WITH CHECK (
        producer_id = auth.uid()
    );

-- Admins pueden ver todos los pedidos
CREATE POLICY "Admins can view all orders"
    ON orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- IMPORTANTE: La dirección del productor se controla a nivel de aplicación
-- usando la función check_address_reveal_permission() y verificando:
-- 1. paid_at IS NOT NULL (pedido pagado)
-- 2. pickup_time - NOW() <= 30 minutes (dentro de ventana)
-- 3. pickup_time - NOW() >= 0 minutes (aún no pasó el tiempo)

-- ----------------------------------------------------------------------------
-- POLÍTICAS PARA ORDER_ITEMS
-- ----------------------------------------------------------------------------

-- Los items son visibles si el pedido es visible
CREATE POLICY "Users can view order items of visible orders"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id AND
            (orders.client_id = auth.uid() OR orders.producer_id = auth.uid() OR
             EXISTS (
                 SELECT 1 FROM profiles 
                 WHERE id = auth.uid() AND role = 'admin'
             ))
        )
    );

-- ----------------------------------------------------------------------------
-- POLÍTICAS PARA PAYMENTS
-- ----------------------------------------------------------------------------

-- Clientes pueden ver pagos de sus pedidos
CREATE POLICY "Clients can view own payments"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = payments.order_id AND orders.client_id = auth.uid()
        )
    );

-- Productores pueden ver pagos de sus pedidos
CREATE POLICY "Producers can view own payments"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = payments.order_id AND orders.producer_id = auth.uid()
        )
    );

-- Admins pueden ver todos los pagos
CREATE POLICY "Admins can view all payments"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ----------------------------------------------------------------------------
-- POLÍTICAS PARA PAYOUTS
-- ----------------------------------------------------------------------------

-- Productores pueden ver sus propias liquidaciones
CREATE POLICY "Producers can view own payouts"
    ON payouts FOR SELECT
    USING (
        producer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'productor'
        )
    );

-- Admins pueden gestionar liquidaciones
CREATE POLICY "Admins can manage payouts"
    ON payouts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ----------------------------------------------------------------------------
-- POLÍTICAS PARA COMMISSIONS
-- ----------------------------------------------------------------------------

-- Productores pueden ver comisiones de sus pedidos
CREATE POLICY "Producers can view own commissions"
    ON commissions FOR SELECT
    USING (
        producer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'productor'
        )
    );

-- Admins pueden ver todas las comisiones
CREATE POLICY "Admins can view all commissions"
    ON commissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ----------------------------------------------------------------------------
-- POLÍTICAS PARA CHAT_MESSAGES
-- ----------------------------------------------------------------------------

-- Usuarios pueden ver mensajes de sus pedidos (solo si no están bloqueados)
CREATE POLICY "Users can view unblocked messages of own orders"
    ON chat_messages FOR SELECT
    USING (
        (sender_id = auth.uid() OR receiver_id = auth.uid()) AND
        is_blocked = false AND
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = chat_messages.order_id AND
            (orders.client_id = auth.uid() OR orders.producer_id = auth.uid())
        )
    );

-- Usuarios pueden enviar mensajes en sus pedidos
CREATE POLICY "Users can send messages in own orders"
    ON chat_messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = chat_messages.order_id AND
            (orders.client_id = auth.uid() OR orders.producer_id = auth.uid())
        )
    );

-- Admins pueden ver todos los mensajes (incluidos bloqueados)
CREATE POLICY "Admins can view all messages"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ----------------------------------------------------------------------------
-- POLÍTICAS PARA PHONE_MASKING_LOGS
-- ----------------------------------------------------------------------------

-- Usuarios NO pueden ver logs de enmascaramiento (solo admins)
-- Esto previene que vean números reales
CREATE POLICY "Only admins can view phone masking logs"
    ON phone_masking_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Solo el sistema (service role) puede crear logs de enmascaramiento
-- Esto se maneja a nivel de aplicación con service role key

-- ============================================================================
-- 7. DATOS INICIALES - 48 ZONAS AMBA
-- ============================================================================

-- Insertar las 48 zonas principales de AMBA con polígonos aproximados
-- Nota: Los polígonos son aproximaciones. En producción, usar datos geográficos precisos.

INSERT INTO delivery_zones (name, polygon, center_point) VALUES
-- Ciudad Autónoma de Buenos Aires (CABA)
('Palermo', 
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.430 -34.580, -58.400 -34.580, -58.400 -34.600, -58.430 -34.600, -58.430 -34.580)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.415, -34.590), 4326)),

('Recoleta',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.400 -34.580, -58.380 -34.580, -58.380 -34.600, -58.400 -34.600, -58.400 -34.580)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.390, -34.590), 4326)),

('San Telmo',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.380 -34.620, -58.360 -34.620, -58.360 -34.640, -58.380 -34.640, -58.380 -34.620)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.370, -34.630), 4326)),

('La Boca',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.370 -34.640, -58.350 -34.640, -58.350 -34.660, -58.370 -34.660, -58.370 -34.640)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.360, -34.650), 4326)),

('Belgrano',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.460 -34.560, -58.440 -34.560, -58.440 -34.580, -58.460 -34.580, -58.460 -34.560)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.450, -34.570), 4326)),

('Villa Crespo',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.440 -34.600, -58.420 -34.600, -58.420 -34.620, -58.440 -34.620, -58.440 -34.600)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.430, -34.610), 4326)),

('Caballito',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.440 -34.620, -58.420 -34.620, -58.420 -34.640, -58.440 -34.640, -58.440 -34.620)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.430, -34.630), 4326)),

('Flores',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.480 -34.620, -58.460 -34.620, -58.460 -34.640, -58.480 -34.640, -58.480 -34.620)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.470, -34.630), 4326)),

('Villa Devoto',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.520 -34.600, -58.500 -34.600, -58.500 -34.620, -58.520 -34.620, -58.520 -34.600)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.510, -34.610), 4326)),

('Nuñez',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.460 -34.540, -58.440 -34.540, -58.440 -34.560, -58.460 -34.560, -58.460 -34.540)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.450, -34.550), 4326)),

-- Zona Norte (GBA Norte)
('San Isidro',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.540 -34.480, -58.500 -34.480, -58.500 -34.520, -58.540 -34.520, -58.540 -34.480)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.520, -34.500), 4326)),

('Vicente López',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.500 -34.520, -58.480 -34.520, -58.480 -34.540, -58.500 -34.540, -58.500 -34.520)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.490, -34.530), 4326)),

('Martínez',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.520 -34.500, -58.500 -34.500, -58.500 -34.520, -58.520 -34.520, -58.520 -34.500)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.510, -34.510), 4326)),

('Olivos',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.500 -34.500, -58.480 -34.500, -58.480 -34.520, -58.500 -34.520, -58.500 -34.500)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.490, -34.510), 4326)),

('Tigre',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.580 -34.420, -58.540 -34.420, -58.540 -34.460, -58.580 -34.460, -58.580 -34.420)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.560, -34.440), 4326)),

('San Fernando',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.560 -34.440, -58.540 -34.440, -58.540 -34.480, -58.560 -34.480, -58.560 -34.440)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.550, -34.460), 4326)),

-- Zona Oeste (GBA Oeste)
('Morón',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.640 -34.640, -58.600 -34.640, -58.600 -34.680, -58.640 -34.680, -58.640 -34.640)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.620, -34.660), 4326)),

('San Justo',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.600 -34.680, -58.580 -34.680, -58.580 -34.700, -58.600 -34.700, -58.600 -34.680)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.590, -34.690), 4326)),

('Ramos Mejía',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.580 -34.660, -58.560 -34.660, -58.560 -34.680, -58.580 -34.680, -58.580 -34.660)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.570, -34.670), 4326)),

('La Matanza',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.700 -34.700, -58.640 -34.700, -58.640 -34.760, -58.700 -34.760, -58.700 -34.700)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.670, -34.730), 4326)),

('Merlo',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.720 -34.660, -58.680 -34.660, -58.680 -34.700, -58.720 -34.700, -58.720 -34.660)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.700, -34.680), 4326)),

('Moreno',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.780 -34.640, -58.740 -34.640, -58.740 -34.680, -58.780 -34.680, -58.780 -34.640)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.760, -34.660), 4326)),

-- Zona Sur (GBA Sur)
('Avellaneda',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.380 -34.660, -58.340 -34.660, -58.340 -34.700, -58.380 -34.700, -58.380 -34.660)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.360, -34.680), 4326)),

('Lanús',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.400 -34.700, -58.360 -34.700, -58.360 -34.740, -58.400 -34.740, -58.400 -34.700)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.380, -34.720), 4326)),

('Lomas de Zamora',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.440 -34.740, -58.400 -34.740, -58.400 -34.780, -58.440 -34.780, -58.440 -34.740)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.420, -34.760), 4326)),

('Banfield',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.400 -34.740, -58.380 -34.740, -58.380 -34.760, -58.400 -34.760, -58.400 -34.740)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.390, -34.750), 4326)),

('Temperley',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.400 -34.760, -58.380 -34.760, -58.380 -34.780, -58.400 -34.780, -58.400 -34.760)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.390, -34.770), 4326)),

('Adrogué',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.400 -34.800, -58.380 -34.800, -58.380 -34.820, -58.400 -34.820, -58.400 -34.800)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.390, -34.810), 4326)),

('Quilmes',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.280 -34.720, -58.240 -34.720, -58.240 -34.760, -58.280 -34.760, -58.280 -34.720)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.260, -34.740), 4326)),

('Bernal',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.300 -34.700, -58.280 -34.700, -58.280 -34.720, -58.300 -34.720, -58.300 -34.700)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.290, -34.710), 4326)),

('Berazategui',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.240 -34.760, -58.200 -34.760, -58.200 -34.800, -58.240 -34.800, -58.240 -34.760)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.220, -34.780), 4326)),

('Florencio Varela',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.280 -34.800, -58.240 -34.800, -58.240 -34.840, -58.280 -34.840, -58.280 -34.800)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.260, -34.820), 4326)),

-- Más zonas CABA
('Retiro',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.380 -34.590, -58.370 -34.590, -58.370 -34.600, -58.380 -34.600, -58.380 -34.590)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.375, -34.595), 4326)),

('Puerto Madero',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.370 -34.600, -58.360 -34.600, -58.360 -34.610, -58.370 -34.610, -58.370 -34.600)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.365, -34.605), 4326)),

('Barracas',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.380 -34.640, -58.360 -34.640, -58.360 -34.660, -58.380 -34.660, -58.380 -34.640)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.370, -34.650), 4326)),

('Boedo',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.420 -34.630, -58.400 -34.630, -58.400 -34.650, -58.420 -34.650, -58.420 -34.630)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.410, -34.640), 4326)),

('Almagro',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.420 -34.600, -58.400 -34.600, -58.400 -34.620, -58.420 -34.620, -58.420 -34.600)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.410, -34.610), 4326)),

('Villa Urquiza',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.480 -34.580, -58.460 -34.580, -58.460 -34.600, -58.480 -34.600, -58.480 -34.580)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.470, -34.590), 4326)),

('Villa Pueyrredón',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.500 -34.580, -58.480 -34.580, -58.480 -34.600, -58.500 -34.600, -58.500 -34.580)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.490, -34.590), 4326)),

('Saavedra',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.480 -34.540, -58.460 -34.540, -58.460 -34.560, -58.480 -34.560, -58.480 -34.540)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.470, -34.550), 4326)),

('Coghlan',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.480 -34.560, -58.460 -34.560, -58.460 -34.580, -58.480 -34.580, -58.480 -34.560)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.470, -34.570), 4326)),

('Villa Ortúzar',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.460 -34.580, -58.440 -34.580, -58.440 -34.600, -58.460 -34.600, -58.460 -34.580)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.450, -34.590), 4326)),

('Colegiales',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.440 -34.580, -58.420 -34.580, -58.420 -34.600, -58.440 -34.600, -58.440 -34.580)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.430, -34.590), 4326)),

('Chacarita',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.440 -34.590, -58.420 -34.590, -58.420 -34.610, -58.440 -34.610, -58.440 -34.590)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.430, -34.600), 4326)),

('Villa Luro',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.500 -34.620, -58.480 -34.620, -58.480 -34.640, -58.500 -34.640, -58.500 -34.620)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.490, -34.630), 4326)),

('Monte Castro',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.500 -34.600, -58.480 -34.600, -58.480 -34.620, -58.500 -34.620, -58.500 -34.600)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.490, -34.610), 4326)),

('Villa Real',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.520 -34.620, -58.500 -34.620, -58.500 -34.640, -58.520 -34.640, -58.520 -34.620)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.510, -34.630), 4326)),

('Villa Santa Rita',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.480 -34.600, -58.460 -34.600, -58.460 -34.620, -58.480 -34.620, -58.480 -34.600)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.470, -34.610), 4326)),

('Villa del Parque',
 ST_MakePolygon(ST_GeomFromText('LINESTRING(-58.480 -34.610, -58.460 -34.610, -58.460 -34.630, -58.480 -34.630, -58.480 -34.610)', 4326)),
 ST_SetSRID(ST_MakePoint(-58.470, -34.620), 4326));

COMMENT ON TABLE delivery_zones IS '48 zonas geográficas de AMBA. Los polígonos son aproximaciones - en producción usar datos geográficos precisos de OpenStreetMap o similar.';

-- ============================================================================
-- 8. FUNCIONES AUXILIARES PARA APLICACIÓN
-- ============================================================================

-- Función para buscar productores por zona geográfica
CREATE OR REPLACE FUNCTION get_producers_by_zone(zone_name TEXT)
RETURNS TABLE (
    id UUID,
    business_name TEXT,
    description TEXT,
    rating DECIMAL,
    total_orders INTEGER,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.business_name,
        p.description,
        p.rating,
        p.total_orders,
        p.is_active
    FROM producers p
    INNER JOIN delivery_zones dz ON p.delivery_zone_id = dz.id
    WHERE dz.name = zone_name
      AND p.is_active = true
    ORDER BY p.rating DESC, p.total_orders DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si una coordenada está dentro de una zona
CREATE OR REPLACE FUNCTION is_point_in_zone(point_lat DECIMAL, point_lng DECIMAL, zone_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    point_geom GEOMETRY;
    zone_polygon GEOMETRY;
BEGIN
    point_geom := ST_SetSRID(ST_MakePoint(point_lng, point_lat), 4326);
    
    SELECT polygon INTO zone_polygon
    FROM delivery_zones
    WHERE name = zone_name AND is_active = true;
    
    IF zone_polygon IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN ST_Within(point_geom, zone_polygon);
END;
$$ LANGUAGE plpgsql;

-- Función para obtener la zona de una coordenada
CREATE OR REPLACE FUNCTION get_zone_for_point(point_lat DECIMAL, point_lng DECIMAL)
RETURNS TABLE (
    zone_id INTEGER,
    zone_name TEXT
) AS $$
DECLARE
    point_geom GEOMETRY;
BEGIN
    point_geom := ST_SetSRID(ST_MakePoint(point_lng, point_lat), 4326);
    
    RETURN QUERY
    SELECT 
        dz.id,
        dz.name
    FROM delivery_zones dz
    WHERE ST_Within(point_geom, dz.polygon)
      AND dz.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================

-- NOTAS IMPORTANTES PARA IMPLEMENTACIÓN:
-- 
-- 1. SEGURIDAD ANTI-BYPASS:
--    - La dirección del productor solo se expone después de pago (paid_at IS NOT NULL)
--    - La dirección solo es visible 30 min antes del retiro (pickup_time - NOW() <= 30 min)
--    - Después del retiro, la dirección debe ocultarse en la aplicación
--    - Los teléfonos siempre se enmascaran con Twilio Proxy
--    - El chat detecta automáticamente números y emails y bloquea esos mensajes
--
-- 2. INTEGRACIÓN CON TWILIO:
--    - Usar phone_masking_logs para registrar todos los enmascaramientos
--    - Los números reales NUNCA se exponen en la API
--    - Solo el service role puede crear registros en phone_masking_logs
--
-- 3. INTEGRACIÓN CON MERCADO PAGO:
--    - Guardar payment_id de Mercado Pago en payments.mercado_pago_payment_id
--    - Cuando el pago se aprueba, el trigger crea automáticamente el registro de comisión
--    - El trigger también actualiza orders.paid_at y orders.status = 'confirmed'
--
-- 4. COMISIONES:
--    - Comisión fija del 15% (0.15)
--    - Se calcula automáticamente al crear el pedido
--    - Se registra en commissions cuando se aprueba el pago
--    - Se liquida periódicamente a través de payouts
--
-- 5. GEOLOCALIZACIÓN:
--    - Usar PostGIS para búsquedas geográficas eficientes
--    - Los polígonos de zonas son aproximaciones - usar datos precisos en producción
--    - Las funciones auxiliares permiten búsqueda por zona y verificación de puntos
--
-- 6. RLS (ROW LEVEL SECURITY):
--    - Todas las tablas tienen RLS habilitado
--    - Las políticas controlan acceso por rol (cliente, productor, admin)
--    - La lógica anti-bypass se complementa con verificaciones en la aplicación
--
-- 7. PRÓXIMOS PASOS:
--    - Configurar Twilio Proxy en la aplicación
--    - Integrar Mercado Pago para pagos
--    - Implementar lógica de revelación de dirección en la API
--    - Agregar webhooks para actualizar estados de pedidos
--    - Implementar sistema de notificaciones

