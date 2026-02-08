-- =====================================================
-- MIGRACIÓN 128: CORRECCIÓN DE DESAJUSTE DE ESTADOS Y AISLAMIENTO SAAS EN ANALÍTICA
-- Fecha: 8 de febrero de 2026
-- Bug: Reportes no suman ventas del mes / Mezcla datos de otros restaurantes
-- Causa: 
-- 1. Las funciones analíticas no incluían el estado 'delivered'.
-- 2. Falta de filtro restaurant_id (Aislamiento Multi-tenant).
-- =====================================================

-- 1. ACTUALIZAR get_sales_daily
CREATE OR REPLACE FUNCTION get_sales_daily()
RETURNS TABLE (
    day DATE,
    total_sales DECIMAL,
    order_count BIGINT
) AS $$
DECLARE
    v_restaurant_id UUID := public.get_my_restaurant_id();
BEGIN
    RETURN QUERY
    SELECT 
        DATE(created_at) as day,
        COALESCE(SUM(total), 0) as total_sales,
        COUNT(*) as order_count
    FROM orders
    WHERE 
        restaurant_id = v_restaurant_id              -- ✅ Filtro SaaS
        AND status IN ('completed', 'paid', 'delivered')  -- ✅ Incluido 'delivered'
        AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY day DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ACTUALIZAR get_sales_by_category
CREATE OR REPLACE FUNCTION get_sales_by_category()
RETURNS TABLE (
    category TEXT,
    total_sales DECIMAL,
    items_sold BIGINT
) AS $$
DECLARE
    v_restaurant_id UUID := public.get_my_restaurant_id();
BEGIN
    RETURN QUERY
    SELECT 
        p.category,
        COALESCE(SUM(oi.subtotal), 0) as total_sales,
        COALESCE(SUM(oi.quantity), 0) as items_sold
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE 
        o.restaurant_id = v_restaurant_id            -- ✅ Filtro SaaS
        AND o.status IN ('completed', 'paid', 'delivered')  -- ✅ Incluido 'delivered'
    GROUP BY p.category
    ORDER BY total_sales DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ACTUALIZAR get_top_products
CREATE OR REPLACE FUNCTION get_top_products()
RETURNS TABLE (
    product_name TEXT,
    total_quantity BIGINT,
    total_revenue DECIMAL
) AS $$
DECLARE
    v_restaurant_id UUID := public.get_my_restaurant_id();
BEGIN
    RETURN QUERY
    SELECT 
        p.name as product_name,
        COALESCE(SUM(oi.quantity), 0) as total_quantity,
        COALESCE(SUM(oi.subtotal), 0) as total_revenue
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE 
        o.restaurant_id = v_restaurant_id            -- ✅ Filtro SaaS
        AND o.status IN ('completed', 'paid', 'delivered')  -- ✅ Incluido 'delivered'
    GROUP BY p.name
    ORDER BY total_quantity DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ACTUALIZAR get_dashboard_kpis
CREATE OR REPLACE FUNCTION get_dashboard_kpis()
RETURNS TABLE (
    total_revenue_month DECIMAL,
    total_orders_month BIGINT,
    avg_ticket DECIMAL,
    total_customers BIGINT
) AS $$
DECLARE
    v_start_month TIMESTAMPTZ := DATE_TRUNC('month', NOW());
    v_restaurant_id UUID := public.get_my_restaurant_id();
BEGIN
    RETURN QUERY
    SELECT
        -- Total de ingresos del mes actual
        COALESCE(SUM(total) FILTER (WHERE created_at >= v_start_month), 0) as total_revenue_month,
        
        -- Total de órdenes del mes actual
        COUNT(*) FILTER (WHERE created_at >= v_start_month) as total_orders_month,
        
        -- Ticket promedio del mes actual
        COALESCE(AVG(total) FILTER (WHERE created_at >= v_start_month), 0) as avg_ticket,
        
        -- Total de clientes (compartido o por restaurante?)
        -- Generalmente los perfiles son globales o por restaurante. 
        -- Si profiles tiene restaurant_id, lo filtramos.
        (
            SELECT COUNT(DISTINCT id) 
            FROM profiles 
            WHERE role = 'customer'
            AND (restaurant_id = v_restaurant_id OR restaurant_id IS NULL)
        ) as total_customers
    FROM orders
    WHERE 
        restaurant_id = v_restaurant_id               -- ✅ Filtro SaaS
        AND status IN ('completed', 'paid', 'delivered');  -- ✅ Incluido 'delivered'
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ACTUALIZAR get_avg_preparation_time
CREATE OR REPLACE FUNCTION get_avg_preparation_time(
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    avg_minutes NUMERIC,
    total_orders BIGINT,
    fastest_time INTEGER,
    slowest_time INTEGER
) AS $$
DECLARE
    v_restaurant_id UUID := public.get_my_restaurant_id();
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(
            ROUND(
                AVG(
                    EXTRACT(EPOCH FROM (preparation_finished_at - preparation_started_at))/60
                )::NUMERIC, 
                2
            ), 
            0
        ) as avg_minutes,
        COUNT(*) as total_orders,
        COALESCE(
            MIN(
                EXTRACT(EPOCH FROM (preparation_finished_at - preparation_started_at))/60
            )::INTEGER,
            0
        ) as fastest_time,
        COALESCE(
            MAX(
                EXTRACT(EPOCH FROM (preparation_finished_at - preparation_started_at))/60
            )::INTEGER,
            0
        ) as slowest_time
    FROM orders
    WHERE 
        restaurant_id = v_restaurant_id               -- ✅ Filtro SaaS
        AND preparation_started_at IS NOT NULL
        AND preparation_finished_at IS NOT NULL
        AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ACTUALIZAR get_sales_by_payment_method
CREATE OR REPLACE FUNCTION get_sales_by_payment_method(
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    payment_method TEXT,
    total_sales DECIMAL,
    order_count BIGINT,
    percentage NUMERIC
) AS $$
DECLARE
    v_total_sales DECIMAL;
    v_restaurant_id UUID := public.get_my_restaurant_id();
BEGIN
    -- Calcular total de ventas para porcentaje
    SELECT COALESCE(SUM(total), 0)
    INTO v_total_sales
    FROM orders
    WHERE 
        restaurant_id = v_restaurant_id               -- ✅ Filtro SaaS
        AND status IN ('completed', 'paid', 'delivered')
        AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
    
    RETURN QUERY
    SELECT 
        o.payment_method,
        COALESCE(SUM(o.total), 0) as total_sales,
        COUNT(*) as order_count,
        CASE 
            WHEN v_total_sales > 0 THEN 
                ROUND((COALESCE(SUM(o.total), 0) / v_total_sales * 100)::NUMERIC, 2)
            ELSE 0 
        END as percentage
    FROM orders o
    WHERE 
        o.restaurant_id = v_restaurant_id            -- ✅ Filtro SaaS
        AND o.status IN ('completed', 'paid', 'delivered')
        AND o.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY o.payment_method
    ORDER BY total_sales DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_dashboard_kpis IS 
'Retorna KPIs principales del dashboard con aislamiento SaaS y soporte para estado delivered.';
