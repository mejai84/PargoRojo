-- Funciones para Reportes y Dashboard

-- 1. Ventas diarias (ultimos 30 dias)
CREATE OR REPLACE FUNCTION get_sales_daily()
RETURNS TABLE (
    day DATE,
    total_sales DECIMAL,
    order_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(created_at) as day,
        SUM(total) as total_sales,
        COUNT(*) as order_count
    FROM orders
    WHERE 
        status = 'delivered' 
        AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY day DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. Ventas por categoria
CREATE OR REPLACE FUNCTION get_sales_by_category()
RETURNS TABLE (
    category TEXT,
    total_sales DECIMAL,
    items_sold BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.category,
        SUM(oi.price * oi.quantity) as total_sales,
        SUM(oi.quantity) as items_sold
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'delivered'
    GROUP BY p.category
    ORDER BY total_sales DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. Top productos mas vendidos
CREATE OR REPLACE FUNCTION get_top_products()
RETURNS TABLE (
    product_name TEXT,
    total_quantity BIGINT,
    total_revenue DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.name as product_name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.price * oi.quantity) as total_revenue
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'delivered'
    GROUP BY p.name
    ORDER BY total_quantity DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- 4. Metricas generales (KPIs)
CREATE OR REPLACE FUNCTION get_dashboard_kpis()
RETURNS TABLE (
    total_revenue_month DECIMAL,
    total_orders_month BIGINT,
    avg_ticket DECIMAL,
    total_customers BIGINT
) AS $$
DECLARE
    v_start_month TIMESTAMPTZ := DATE_TRUNC('month', NOW());
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(total) FILTER (WHERE created_at >= v_start_month), 0) as total_revenue_month,
        COUNT(*) FILTER (WHERE created_at >= v_start_month) as total_orders_month,
        COALESCE(AVG(total) FILTER (WHERE created_at >= v_start_month), 0) as avg_ticket,
        (SELECT COUNT(*) FROM auth.users WHERE raw_user_meta_data->>'role' = 'customer') as total_customers
    FROM orders
    WHERE status = 'delivered';
END;
$$ LANGUAGE plpgsql;
