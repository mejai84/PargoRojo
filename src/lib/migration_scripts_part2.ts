
// 125: Fix Tables RLS
export const MIGRATION_125 = `
-- Drop old policies
DROP POLICY IF EXISTS "tables_select_policy" ON tables;
DROP POLICY IF EXISTS "tables_insert_policy" ON tables;
DROP POLICY IF EXISTS "tables_update_policy" ON tables;
DROP POLICY IF EXISTS "tables_delete_policy" ON tables;
DROP POLICY IF EXISTS "Admin ve todas las mesas" ON tables;
DROP POLICY IF EXISTS "Staff ve mesas activas" ON tables;
DROP POLICY IF EXISTS "Solo admin puede modificar mesas" ON tables;

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "tables_select_all" ON tables FOR SELECT TO authenticated USING (true);
CREATE POLICY "tables_select_public" ON tables FOR SELECT TO anon USING (active = true);
CREATE POLICY "tables_insert_admin" ON tables FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Update policy for admin/staff/waiter
CREATE POLICY "tables_update_admin_staff" ON tables FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff', 'waiter'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff', 'waiter')));

CREATE POLICY "tables_delete_admin" ON tables FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Add columns if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'x_pos') THEN ALTER TABLE tables ADD COLUMN x_pos INTEGER DEFAULT 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'y_pos') THEN ALTER TABLE tables ADD COLUMN y_pos INTEGER DEFAULT 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'width') THEN ALTER TABLE tables ADD COLUMN width INTEGER DEFAULT 120; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'height') THEN ALTER TABLE tables ADD COLUMN height INTEGER DEFAULT 120; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'rotation') THEN ALTER TABLE tables ADD COLUMN rotation INTEGER DEFAULT 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'shape') THEN ALTER TABLE tables ADD COLUMN shape TEXT DEFAULT 'rectangle'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'updated_at') THEN ALTER TABLE tables ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tables_active ON tables(active);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);

CREATE OR REPLACE FUNCTION update_table_position(p_table_id UUID, p_x_pos INTEGER, p_y_pos INTEGER, p_width INTEGER DEFAULT NULL, p_height INTEGER DEFAULT NULL, p_rotation INTEGER DEFAULT NULL, p_shape TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE tables SET x_pos = p_x_pos, y_pos = p_y_pos, width = COALESCE(p_width, width), height = COALESCE(p_height, height), rotation = COALESCE(p_rotation, rotation), shape = COALESCE(p_shape, shape), updated_at = NOW() WHERE id = p_table_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

// 122: Fix Analytics Functions (shortened slightly, mainly the function bodies)
export const MIGRATION_122 = `
CREATE OR REPLACE FUNCTION get_dashboard_kpis()
RETURNS TABLE (total_revenue_month DECIMAL, total_orders_month BIGINT, avg_ticket DECIMAL, total_customers BIGINT) AS $$
DECLARE v_start_month TIMESTAMPTZ := DATE_TRUNC('month', NOW());
BEGIN
    RETURN QUERY SELECT COALESCE(SUM(total) FILTER (WHERE created_at >= v_start_month), 0), COUNT(*) FILTER (WHERE created_at >= v_start_month), COALESCE(AVG(total) FILTER (WHERE created_at >= v_start_month), 0), (SELECT COUNT(DISTINCT id) FROM profiles WHERE role = 'customer')
    FROM orders WHERE status IN ('completed', 'paid');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_sales_daily() RETURNS TABLE (day DATE, total_sales DECIMAL, order_count BIGINT) AS $$
BEGIN RETURN QUERY SELECT DATE(created_at), COALESCE(SUM(total), 0), COUNT(*) FROM orders WHERE status IN ('completed', 'paid') AND created_at >= NOW() - INTERVAL '30 days' GROUP BY DATE(created_at) ORDER BY day DESC; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;
