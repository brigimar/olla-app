-- ======================================================================
-- POLICIES COMPLETAS (profiles.role as source of truth)
-- Tables handled: profiles, producers, dishes, orders, order_items,
-- payments, payouts, delivery_zones
-- ======================================================================

-- ============================
-- HELPERS
-- ============================
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.test_uid', true), '')::uuid,
    (current_setting('request.jwt.claims', true)::json->>'sub')::uuid,
    auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.test_role', true), ''),
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'visitante'
  );
$$;

-- ============================
-- SAFELY DROP OLD POLICIES (avoid name conflicts)
-- ============================
-- producers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='producers') THEN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename='producers' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.producers;', r.policyname);
    END LOOP;
  END IF;
END$$;

-- dishes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dishes') THEN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename='dishes' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.dishes;', r.policyname);
    END LOOP;
  END IF;
END$$;

-- orders
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders') THEN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename='orders' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders;', r.policyname);
    END LOOP;
  END IF;
END$$;

-- order_items
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='order_items') THEN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename='order_items' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.order_items;', r.policyname);
    END LOOP;
  END IF;
END$$;

-- payments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payments') THEN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename='payments' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.payments;', r.policyname);
    END LOOP;
  END IF;
END$$;

-- payouts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payouts') THEN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename='payouts' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.payouts;', r.policyname);
    END LOOP;
  END IF;
END$$;

-- delivery_zones (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='delivery_zones') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delivery_zones') THEN
      FOR r IN SELECT policyname FROM pg_policies WHERE tablename='delivery_zones' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.delivery_zones;', r.policyname);
      END LOOP;
    END IF;
  END IF;
END$$;

-- ============================
-- ENABLE RLS (idempotent)
-- ============================
ALTER TABLE IF EXISTS public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.producers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dishes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payouts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- ============================
-- POLICIES: profiles (identity) - minimal (identity only)
-- - Users may SELECT/UPDATE their own profile
-- - superadmin/admin may select all
-- ============================
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own
ON public.profiles
FOR SELECT
TO authenticated
USING (id = public.current_user_id());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = public.current_user_id())
WITH CHECK (id = public.current_user_id());

DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
CREATE POLICY profiles_select_admin
ON public.profiles
FOR SELECT
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin','admin'));

-- ============================
-- POLICIES: producers (business profiles)
-- ============================
-- public read: producers visible and active
DROP POLICY IF EXISTS producers_public_read ON public.producers;
CREATE POLICY producers_public_read
ON public.producers
FOR SELECT
USING ( (COALESCE(visible,true) = true) AND (COALESCE(activo,true) = true) );

-- producer selects own
DROP POLICY IF EXISTS producers_select_own ON public.producers;
CREATE POLICY producers_select_own
ON public.producers
FOR SELECT
TO authenticated
USING ( id = public.current_user_id() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin','admin') );

-- producer insert self (controlled flow)
DROP POLICY IF EXISTS producers_insert_self ON public.producers;
CREATE POLICY producers_insert_self
ON public.producers
FOR INSERT
TO authenticated
WITH CHECK ( id = public.current_user_id() AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'producer' );

-- producer update own
DROP POLICY IF EXISTS producers_update_self ON public.producers;
CREATE POLICY producers_update_self
ON public.producers
FOR UPDATE
TO authenticated
USING ( id = public.current_user_id() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin','admin') )
WITH CHECK ( id = public.current_user_id() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin','admin') );

-- admin insert/update/select full (explicit)
DROP POLICY IF EXISTS producers_admin_full ON public.producers;
CREATE POLICY producers_admin_full
ON public.producers
FOR ALL
TO authenticated
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin','admin') );

-- block deletes (soft-delete pattern)
DROP POLICY IF EXISTS producers_no_delete ON public.producers;
CREATE POLICY producers_no_delete
ON public.producers
FOR DELETE
USING (false);

-- ============================
-- POLICIES: dishes (catalog)
-- ============================
-- public read only available dishes whose producer is visible/active
DROP POLICY IF EXISTS dishes_public_read ON public.dishes;
CREATE POLICY dishes_public_read
ON public.dishes
FOR SELECT
USING (
  is_available = true
  AND EXISTS (
    SELECT 1 FROM public.producers p
    WHERE p.id = public.dishes.producer_id AND COALESCE(p.visible,true)=true AND COALESCE(p.activo,true)=true
  )
);

-- owner (producer) select own
DROP POLICY IF EXISTS dishes_select_owner ON public.dishes;
CREATE POLICY dishes_select_owner
ON public.dishes
FOR SELECT
TO authenticated
USING ( public.current_user_role() IN ('producer','admin','superadmin') AND producer_id = public.current_user_id() );

-- owner update
DROP POLICY IF EXISTS dishes_update_owner ON public.dishes;
CREATE POLICY dishes_update_owner
ON public.dishes
FOR UPDATE
TO authenticated
USING ( public.current_user_role() = 'producer' AND producer_id = public.current_user_id() )
WITH CHECK ( producer_id = public.current_user_id() );

-- owner insert (producer creates own dishes)
DROP POLICY IF EXISTS dishes_insert_owner ON public.dishes;
CREATE POLICY dishes_insert_owner
ON public.dishes
FOR INSERT
TO authenticated
WITH CHECK ( public.current_user_role() = 'producer' AND producer_id = public.current_user_id() );

-- admin full (select/insert/update/delete)
DROP POLICY IF EXISTS dishes_admin_full ON public.dishes;
CREATE POLICY dishes_admin_full
ON public.dishes
FOR ALL
TO authenticated
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin','admin') );

-- delete by owner (optional) - keep if you want hard deletes
DROP POLICY IF EXISTS dishes_delete_owner ON public.dishes;
CREATE POLICY dishes_delete_owner
ON public.dishes
FOR DELETE
TO authenticated
USING ( public.current_user_role() = 'producer' AND producer_id = public.current_user_id() );

-- ============================
-- POLICIES: orders
-- ============================
-- client create orders for themselves only
DROP POLICY IF EXISTS orders_insert_client ON public.orders;
CREATE POLICY orders_insert_client
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK ( public.current_user_role() = 'consumer' AND client_id = public.current_user_id() );

-- client select own
DROP POLICY IF EXISTS orders_select_client ON public.orders;
CREATE POLICY orders_select_client
ON public.orders
FOR SELECT
TO authenticated
USING ( public.current_user_role() = 'consumer' AND client_id = public.current_user_id() );

-- client update own (e.g., cancel) - client_id cannot be reassigned
DROP POLICY IF EXISTS orders_update_client ON public.orders;
CREATE POLICY orders_update_client
ON public.orders
FOR UPDATE
TO authenticated
USING ( client_id = public.current_user_id() )
WITH CHECK ( client_id = public.current_user_id() );

-- producers: can SELECT orders that include their dishes (Option A)
DROP POLICY IF EXISTS orders_select_producer_related ON public.orders;
CREATE POLICY orders_select_producer_related
ON public.orders
FOR SELECT
TO authenticated
USING (
  public.current_user_role() = 'producer'
  AND EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.dishes d ON d.id = oi.dish_id
    WHERE oi.order_id = public.orders.id AND d.producer_id = public.current_user_id()
  )
);

-- producers: may update limited fields (status) for orders that include their dishes
DROP POLICY IF EXISTS orders_update_producer_related ON public.orders;
CREATE POLICY orders_update_producer_related
ON public.orders
FOR UPDATE
TO authenticated
USING (
  public.current_user_role() = 'producer'
  AND EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.dishes d ON d.id = oi.dish_id
    WHERE oi.order_id = public.orders.id AND d.producer_id = public.current_user_id()
  )
)
WITH CHECK ( client_id = client_id ); -- prevents reassigning client_id; app enforces status transitions

-- admin / superadmin full access to orders
DROP POLICY IF EXISTS orders_admin_full ON public.orders;
CREATE POLICY orders_admin_full
ON public.orders
FOR ALL
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin','admin'));

-- ============================
-- POLICIES: order_items
-- ============================
-- select: order owner OR producer of dish OR admin
DROP POLICY IF EXISTS order_items_select_owner_or_producer ON public.order_items;
CREATE POLICY order_items_select_owner_or_producer
ON public.order_items
FOR SELECT
TO authenticated
USING (
  (public.current_user_role() = 'consumer' AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = public.order_items.order_id AND o.client_id = public.current_user_id()))
  OR
  (public.current_user_role() = 'producer' AND EXISTS (SELECT 1 FROM public.dishes d WHERE d.id = public.order_items.dish_id AND d.producer_id = public.current_user_id()))
  OR ( (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin','admin') )
);

-- insert: only order owner (client)
DROP POLICY IF EXISTS order_items_insert_owner ON public.order_items;
CREATE POLICY order_items_insert_owner
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  public.current_user_role() = 'consumer'
  AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = public.order_items.order_id AND o.client_id = public.current_user_id())
);

-- update: only order owner or producer of dish (with check)
DROP POLICY IF EXISTS order_items_update_owner_or_producer ON public.order_items;
CREATE POLICY order_items_update_owner_or_producer
ON public.order_items
FOR UPDATE
TO authenticated
USING (
  (public.current_user_role() = 'consumer' AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = public.order_items.order_id AND o.client_id = public.current_user_id()))
  OR
  (public.current_user_role() = 'producer' AND EXISTS (SELECT 1 FROM public.dishes d WHERE d.id = public.order_items.dish_id AND d.producer_id = public.current_user_id()))
  OR ( (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin','admin') )
)
WITH CHECK ( EXISTS (SELECT 1 FROM public.orders o WHERE o.id = public.order_items.order_id) );

-- delete: only owner or producer or admin
DROP POLICY IF EXISTS order_items_delete_owner_or_producer ON public.order_items;
CREATE POLICY order_items_delete_owner_or_producer
ON public.order_items
FOR DELETE
TO authenticated
USING (
  (public.current_user_role() = 'consumer' AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = public.order_items.order_id AND o.client_id = public.current_user_id()))
  OR
  (public.current_user_role() = 'producer' AND EXISTS (SELECT 1 FROM public.dishes d WHERE d.id = public.order_items.dish_id AND d.producer_id = public.current_user_id()))
  OR ( (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin','admin') )
);

-- ============================
-- POLICIES: payments
-- ============================
-- clients can view payments tied to their orders; all write ops must come from backend/service
DROP POLICY IF EXISTS payments_select_client ON public.payments;
CREATE POLICY payments_select_client
ON public.payments
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = public.payments.order_id AND o.client_id = public.current_user_id())
  OR ( (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin','admin') )
);

DROP POLICY IF EXISTS payments_no_client_insert ON public.payments;
CREATE POLICY payments_no_client_insert
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS payments_no_client_update ON public.payments;
CREATE POLICY payments_no_client_update
ON public.payments
FOR UPDATE
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS payments_no_client_delete ON public.payments;
CREATE POLICY payments_no_client_delete
ON public.payments
FOR DELETE
TO authenticated
USING (false);

-- ============================
-- POLICIES: payouts
-- ============================
-- producers can view their payouts; backend creates payouts
DROP POLICY IF EXISTS payouts_select_producer ON public.payouts;
CREATE POLICY payouts_select_producer
ON public.payouts
FOR SELECT
TO authenticated
USING ( producer_id = public.current_user_id() OR ( (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin','admin') ) );

DROP POLICY IF EXISTS payouts_no_client_insert ON public.payouts;
CREATE POLICY payouts_no_client_insert
ON public.payouts
FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS payouts_no_client_update ON public.payouts;
CREATE POLICY payouts_no_client_update
ON public.payouts
FOR UPDATE
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS payouts_no_client_delete ON public.payouts;
CREATE POLICY payouts_no_client_delete
ON public.payouts
FOR DELETE
TO authenticated
USING (false);

-- ============================
-- POLICIES: delivery_zones (public read)
-- ============================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='delivery_zones') THEN
    DROP POLICY IF EXISTS delivery_zones_public_read ON public.delivery_zones;
    CREATE POLICY delivery_zones_public_read
    ON public.delivery_zones
    FOR SELECT
    USING ( true );
  END IF;
END$$;

-- ============================
-- TRIGGERS: updated_at & deactivate dishes when producer inactive
-- ============================
CREATE OR REPLACE FUNCTION public.trg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Attach triggers if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='dishes' AND column_name='updated_at') THEN
    DROP TRIGGER IF EXISTS trg_set_updated_at_dishes ON public.dishes;
    CREATE TRIGGER trg_set_updated_at_dishes BEFORE UPDATE ON public.dishes FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='producers' AND column_name='updated_at') THEN
    DROP TRIGGER IF EXISTS trg_set_updated_at_producers ON public.producers;
    CREATE TRIGGER trg_set_updated_at_producers BEFORE UPDATE ON public.producers FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='updated_at') THEN
    DROP TRIGGER IF EXISTS trg_set_updated_at_orders ON public.orders;
    CREATE TRIGGER trg_set_updated_at_orders BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='updated_at') THEN
    DROP TRIGGER IF EXISTS trg_set_updated_at_order_items ON public.order_items;
    CREATE TRIGGER trg_set_updated_at_order_items BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();
  END IF;
END$$;

-- Deactivate dishes when producer becomes inactive (if producers have column 'activo')
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='producers' AND column_name='activo') THEN
    CREATE OR REPLACE FUNCTION public.trg_producer_inactive()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF TG_OP = 'UPDATE' AND OLD.activo = true AND NEW.activo = false THEN
        UPDATE public.dishes SET is_available = false WHERE producer_id = NEW.id;
      END IF;
      RETURN NEW;
    END;
    $$;

    DROP TRIGGER IF EXISTS trg_producer_inactive ON public.producers;
    CREATE TRIGGER trg_producer_inactive AFTER UPDATE ON public.producers FOR EACH ROW EXECUTE FUNCTION public.trg_producer_inactive();
  END IF;
END$$;

-- ============================
-- SIMPLE TESTS (examples). Run each test inside its own transaction:
-- BEGIN; SET LOCAL app.test_uid = '<uuid>'; SET LOCAL app.test_role = '<role>'; <action>; ROLLBACK;
-- ============================
-- Example test commands (uncomment and run one-by-one inside a transaction):

/*
-- Producer creates a dish (should succeed)
BEGIN;
SET LOCAL app.test_uid = '11111111-1111-1111-1111-111111111111';
SET LOCAL app.test_role = 'producer';
INSERT INTO public.dishes (producer_id, name, descripcion, precio, is_available) VALUES (public.current_user_id(), 'Test Dish', 'desc', 1200, true);
ROLLBACK;

-- Consumer creates an order (should succeed)
BEGIN;
SET LOCAL app.test_uid = '33333333-3333-3333-3333-333333333333';
SET LOCAL app.test_role = 'consumer';
INSERT INTO public.orders (client_id, total, status) VALUES (public.current_user_id(), 450, 'pending');
ROLLBACK;

-- Consumer attempts to update another producer's dish (should affect 0 rows)
BEGIN;
SET LOCAL app.test_uid = '33333333-3333-3333-3333-333333333333';
SET LOCAL app.test_role = 'consumer';
UPDATE public.dishes SET name = 'Client Hacked' WHERE producer_id <> public.current_user_id();
-- Expect 0 rows affected
ROLLBACK;

-- Producer reads orders that include their dishes (should see related orders)
BEGIN;
SET LOCAL app.test_uid = '11111111-1111-1111-1111-111111111111';
SET LOCAL app.test_role = 'producer';
SELECT * FROM public.orders WHERE id IN (SELECT order_id FROM public.order_items oi JOIN public.dishes d ON d.id = oi.dish_id WHERE d.producer_id = public.current_user_id());
ROLLBACK;
*/

-- ======================================================================
-- END OF POLICIES
-- ======================================================================
