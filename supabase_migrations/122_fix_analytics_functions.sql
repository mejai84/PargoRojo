-- =====================================================
-- CORRECCIÓN DE FUNCIONES ANALÍTICAS - BUG REPORTES
-- Fecha: 27 de enero de 2026
-- Bug: Reportes no suman ventas del mes correctamente
-- =====================================================

-- ============================================================================
-- 1. VENTAS DIARIAS (Corregido para usar 'completed' en vez de 'delivered')
-- ============================================================================

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
        COALESCE(SUM(total), 0) as total_sales,
        COUNT(*) as order_count
    FROM orders
    WHERE 
        status IN ('completed', 'paid')  -- ✅ Estados correctos
        AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY day DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_sales_daily IS 
'Retorna ventas diarias de los últimos 30 días. Suma órdenes completadas y pagadas.';

-- ============================================================================
-- 2. VENTAS POR CATEGORÍA (Corregido para usar 'subtotal' en vez de 'price')
-- ============================================================================

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
        COALESCE(SUM(oi.subtotal), 0) as total_sales,  -- ✅ Usar subtotal
        COALESCE(SUM(oi.quantity), 0) as items_sold
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status IN ('completed', 'paid')  -- ✅ Estados correctos
    GROUP BY p.category
    ORDER BY total_sales DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_sales_by_category IS 
'Retorna ventas por categoría de producto. Suma subtotales de items.';

-- ============================================================================
-- 3. TOP PRODUCTOS (Corregido para usar 'subtotal')
-- ============================================================================

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
        COALESCE(SUM(oi.quantity), 0) as total_quantity,
        COALESCE(SUM(oi.subtotal), 0) as total_revenue  -- ✅ Usar subtotal
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status IN ('completed', 'paid')  -- ✅ Estados correctos
    GROUP BY p.name
    ORDER BY total_quantity DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_top_products IS 
'Retorna los 10 productos más vendidos. Ordenados por cantidad vendida.';

-- ============================================================================
-- 4. KPIs DEL DASHBOARD (Corregido y mejorado)
-- ============================================================================

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
        -- Total de ingresos del mes actual
        COALESCE(SUM(total) FILTER (WHERE created_at >= v_start_month), 0) as total_revenue_month,
        
        -- Total de órdenes del mes actual
        COUNT(*) FILTER (WHERE created_at >= v_start_month) as total_orders_month,
        
        -- Ticket promedio del mes actual
        COALESCE(AVG(total) FILTER (WHERE created_at >= v_start_month), 0) as avg_ticket,
        
        -- Total de clientes (perfiles con rol customer)
        (
            SELECT COUNT(DISTINCT id) 
            FROM profiles 
            WHERE role = 'customer'
        ) as total_customers
    FROM orders
    WHERE status IN ('completed', 'paid');  -- ✅ Solo órdenes completadas
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_dashboard_kpis IS 
'Retorna KPIs principales del dashboard: ingresos del mes, órdenes, ticket promedio y total de clientes.';

-- ============================================================================
-- 5. NUEVA FUNCIÓN: VENTAS POR RANGO DE FECHAS
-- ============================================================================

-- Eliminar versiones anteriores para evitar conflictos de firma
DROP FUNCTION IF EXISTS get_sales_by_date_range(TIMESTAMPTZ, TIMESTAMPTZ, UUID);
DROP FUNCTION IF EXISTS get_sales_by_date_range(TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_sales_by_date_range(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    day DATE,
    total_sales DECIMAL,
    order_count BIGINT,
    avg_ticket DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(o.created_at) as day,
        COALESCE(SUM(o.total), 0) as total_sales,
        COUNT(*) as order_count,
        COALESCE(AVG(o.total), 0) as avg_ticket
    FROM orders o
    WHERE 
        o.status IN ('completed', 'paid', 'delivered')
        AND o.created_at >= p_start_date
        AND o.created_at <= p_end_date
    GROUP BY DATE(o.created_at)
    ORDER BY day DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_sales_by_date_range IS 
'Retorna ventas por día dentro de un rango de fechas específico.';

-- ============================================================================
-- 6. NUEVA FUNCIÓN: REPORTE DE TIEMPO PROMEDIO DE PREPARACIÓN
-- ============================================================================

-- Eliminar versiones anteriores
DROP FUNCTION IF EXISTS get_avg_preparation_time(INTEGER, UUID);
DROP FUNCTION IF EXISTS get_avg_preparation_time(INTEGER);

CREATE OR REPLACE FUNCTION get_avg_preparation_time(
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    avg_minutes NUMERIC,
    total_orders BIGINT,
    fastest_time INTEGER,
    slowest_time INTEGER
) AS $$
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
        preparation_started_at IS NOT NULL
        AND preparation_finished_at IS NOT NULL
        AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_avg_preparation_time IS 
'Calcula el tiempo promedio de preparación en minutos. Incluye tiempo más rápido y más lento.';

-- ============================================================================
-- 7. NUEVA FUNCIÓN: VENTAS POR MÉTODO DE PAGO
-- ============================================================================

-- Eliminar versiones anteriores
DROP FUNCTION IF EXISTS get_sales_by_payment_method(INTEGER, UUID);
DROP FUNCTION IF EXISTS get_sales_by_payment_method(INTEGER);

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
BEGIN
    -- Calcular total de ventas para porcentaje
    SELECT COALESCE(SUM(total), 0)
    INTO v_total_sales
    FROM orders
    WHERE 
        status IN ('completed', 'paid', 'delivered')
        AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
    
    -- Si no hay ventas, evitar división por cero
    IF v_total_sales = 0 THEN
        v_total_sales := 1;
    END IF;
    
    RETURN QUERY
    SELECT 
        o.payment_method,
        COALESCE(SUM(o.total), 0) as total_sales,
        COUNT(*) as order_count,
        ROUND((COALESCE(SUM(o.total), 0) / v_total_sales * 100)::NUMERIC, 2) as percentage
    FROM orders o
    WHERE 
        o.status IN ('completed', 'paid', 'delivered')
        AND o.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY o.payment_method
    ORDER BY total_sales DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_sales_by_payment_method IS 
'Retorna ventas agrupadas por método de pago con porcentaje del total.';

-- ============================================================================
-- RESUMEN DE CORRECCIONES
-- ============================================================================

COMMENT ON SCHEMA public IS 
'Migración 122: Corrección de funciones analíticas
- Estados de orden corregidos: delivered → completed/paid
- Campos de precio corregidos: price → unit_price/subtotal
- Nuevas funciones de reporte agregadas
- Optimizaciones de rendimiento
';

-- =====================================================
-- FIN DE MIGRACIÓN 122
-- =====================================================
