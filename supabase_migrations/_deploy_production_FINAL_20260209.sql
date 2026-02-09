-- ==============================================================================
-- MASTER DEPLOYMENT SCRIPT - PARGO ROJO PRODUCTION
-- Generated: 2026-02-09
-- Includes:
-- 1. waiter_pin fix (Critical)
-- 2. Migration 121 (Production Bugs Part 1)
-- 3. Migration 122 (Analytics Functions)
-- 4. Migration 125 (Tables RLS)
-- 5. Migration 128 (Analytics Status Mismatch)
-- 6. Migration 129 (Multi-Tenancy Repair)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PART 1: WAITER PIN (Critical Fix)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS waiter_pin TEXT;
COMMENT ON COLUMN public.profiles.waiter_pin IS 'PIN de 4 dígitos para acceso rápido al portal de meseros.';

-- ------------------------------------------------------------------------------
-- PART 2: MIGRATION 121 (Production Bugs)
-- ------------------------------------------------------------------------------
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'notes') THEN
        ALTER TABLE order_items ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'waiter_id') THEN
        ALTER TABLE orders ADD COLUMN waiter_id UUID REFERENCES profiles(id);
        CREATE INDEX IF NOT EXISTS idx_orders_waiter ON orders(waiter_id, created_at DESC);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    customer_name VARCHAR(255),
    customer_tax_id VARCHAR(50),
    subtotal NUMERIC(12, 2) NOT NULL,
    tax NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tables') THEN
        CREATE TABLE IF NOT EXISTS table_transfers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            source_table_id UUID NOT NULL REFERENCES tables(id),
            target_table_id UUID NOT NULL REFERENCES tables(id),
            order_id UUID NOT NULL REFERENCES orders(id),
            transferred_by UUID NOT NULL REFERENCES profiles(id),
            reason TEXT,
            transferred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT different_tables CHECK (source_table_id != target_table_id)
        );
    END IF;
END $$;

CREATE OR REPLACE FUNCTION transfer_order_to_table(
    p_order_id UUID,
    p_target_table_id UUID,
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_source_table_id UUID;
    v_existing_order UUID;
BEGIN
    SELECT o.*, o.table_id INTO v_order FROM orders o WHERE o.id = p_order_id;
    IF v_order.id IS NULL THEN RAISE EXCEPTION 'Orden no encontrada'; END IF;
    v_source_table_id := v_order.table_id;
    
    SELECT id INTO v_existing_order FROM orders WHERE table_id = p_target_table_id AND status NOT IN ('delivered', 'cancelled', 'paid') LIMIT 1;
    
    IF v_existing_order IS NOT NULL THEN
        UPDATE order_items SET order_id = v_existing_order, updated_at = NOW() WHERE order_id = p_order_id;
        UPDATE orders SET subtotal = (SELECT COALESCE(SUM(unit_price * quantity), 0) FROM order_items WHERE order_id = v_existing_order), total = (SELECT COALESCE(SUM(unit_price * quantity), 0) FROM order_items WHERE order_id = v_existing_order), updated_at = NOW() WHERE id = v_existing_order;
        UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = p_order_id;
    ELSE
        UPDATE orders SET table_id = p_target_table_id, updated_at = NOW() WHERE id = p_order_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'table_transfers') THEN
        INSERT INTO table_transfers (source_table_id, target_table_id, order_id, transferred_by, reason) VALUES (v_source_table_id, p_target_table_id, p_order_id, p_user_id, p_reason);
    END IF;
    
    RETURN jsonb_build_object('success', true, 'merged', v_existing_order IS NOT NULL);
END;
$$;

-- ------------------------------------------------------------------------------
-- PART 3: MIGRATION 125 (Tables RLS & Positioning)
-- ------------------------------------------------------------------------------
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tables_select_all" ON tables;
CREATE POLICY "tables_select_all" ON tables FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tables_select_public" ON tables;
CREATE POLICY "tables_select_public" ON tables FOR SELECT TO anon USING (active = true);
DROP POLICY IF EXISTS "tables_insert_admin" ON tables;
CREATE POLICY "tables_insert_admin" ON tables FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "tables_update_admin_staff" ON tables;
CREATE POLICY "tables_update_admin_staff" ON tables FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff', 'waiter'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff', 'waiter')));

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'x_pos') THEN ALTER TABLE tables ADD COLUMN x_pos INTEGER DEFAULT 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'y_pos') THEN ALTER TABLE tables ADD COLUMN y_pos INTEGER DEFAULT 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'width') THEN ALTER TABLE tables ADD COLUMN width INTEGER DEFAULT 120; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'height') THEN ALTER TABLE tables ADD COLUMN height INTEGER DEFAULT 120; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'rotation') THEN ALTER TABLE tables ADD COLUMN rotation INTEGER DEFAULT 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'shape') THEN ALTER TABLE tables ADD COLUMN shape TEXT DEFAULT 'rectangle'; END IF;
END $$;

CREATE OR REPLACE FUNCTION update_table_position(p_table_id UUID, p_x_pos INTEGER, p_y_pos INTEGER, p_width INTEGER DEFAULT NULL, p_height INTEGER DEFAULT NULL, p_rotation INTEGER DEFAULT NULL, p_shape TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE tables SET x_pos = p_x_pos, y_pos = p_y_pos, width = COALESCE(p_width, width), height = COALESCE(p_height, height), rotation = COALESCE(p_rotation, rotation), shape = COALESCE(p_shape, shape), updated_at = NOW() WHERE id = p_table_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- PART 4: MIGRATION 129 (Multi-Tenancy & Exec SQL)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255) UNIQUE,
    logo_url TEXT,
    primary_color VARCHAR(50) DEFAULT '#FF6B35',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.restaurants (id, name, subdomain)
VALUES ('d8616ce5-7651-44ea-814a-96f09e32e8be', 'Jamali OS Default', 'jamali')
ON CONFLICT (id) DO NOTHING;

DO $$ 
DECLARE 
    tbl_name TEXT;
    target_res_id UUID := 'd8616ce5-7651-44ea-814a-96f09e32e8be';
    tables_to_fix TEXT[] := ARRAY['shifts', 'orders', 'products', 'categories', 'tables', 'cashbox_sessions', 'cash_movements', 'cashboxes', 'ingredients', 'recipes', 'inventory_movements', 'petty_cash_vouchers', 'reservations', 'audit_logs', 'shift_definitions', 'customers'];
BEGIN 
    FOREACH tbl_name IN ARRAY tables_to_fix LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl_name AND column_name = 'restaurant_id') THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id)', tbl_name);
                EXECUTE format('UPDATE public.%I SET restaurant_id = %L WHERE restaurant_id IS NULL', tbl_name, target_res_id);
            END IF;
        END IF;
    END LOOP;
END $$;

ALTER TABLE public.shifts DROP CONSTRAINT IF EXISTS shifts_shift_type_check;
ALTER TABLE public.shifts ADD CONSTRAINT shifts_shift_type_check CHECK (shift_type IN ('MORNING', 'AFTERNOON', 'NIGHT', 'CUSTOM', 'Mañana', 'Tarde', 'Noche', 'General'));

CREATE OR REPLACE FUNCTION public.exec_sql(query text) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $body$
BEGIN EXECUTE query; RETURN json_build_object('status', 'success'); EXCEPTION WHEN OTHERS THEN RETURN json_build_object('status', 'error', 'message', SQLERRM); END;
$body$;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- ------------------------------------------------------------------------------
-- PART 5: MIGRATION 128 (Analytics Fixes)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_kpis()
RETURNS TABLE (total_revenue_month DECIMAL, total_orders_month BIGINT, avg_ticket DECIMAL, total_customers BIGINT) AS $$
DECLARE v_start_month TIMESTAMPTZ := DATE_TRUNC('month', NOW()); v_restaurant_id UUID := public.get_my_restaurant_id();
BEGIN
    RETURN QUERY SELECT 
        COALESCE(SUM(total) FILTER (WHERE created_at >= v_start_month), 0), 
        COUNT(*) FILTER (WHERE created_at >= v_start_month), 
        COALESCE(AVG(total) FILTER (WHERE created_at >= v_start_month), 0), 
        (SELECT COUNT(DISTINCT id) FROM profiles WHERE role = 'customer' AND (restaurant_id = v_restaurant_id OR restaurant_id IS NULL))
    FROM orders WHERE restaurant_id = v_restaurant_id AND status IN ('completed', 'paid', 'delivered');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_sales_daily() RETURNS TABLE (day DATE, total_sales DECIMAL, order_count BIGINT) AS $$
DECLARE v_restaurant_id UUID := public.get_my_restaurant_id();
BEGIN RETURN QUERY SELECT DATE(created_at), COALESCE(SUM(total), 0), COUNT(*) FROM orders WHERE restaurant_id = v_restaurant_id AND status IN ('completed', 'paid', 'delivered') AND created_at >= NOW() - INTERVAL '30 days' GROUP BY DATE(created_at) ORDER BY day DESC; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- FINISH: Reload Schema
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
