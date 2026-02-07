-- =========================================================
-- DIAGNÓSTICO DE REPORTES - POR QUÉ APARECEN EN $0
-- Ejecutar en Supabase Dashboard > SQL Editor
-- =========================================================

-- 1. ¿CUÁNTAS ÓRDENES HAY EN TOTAL?
SELECT 
    'Total de órdenes' as metrica,
    COUNT(*) as cantidad
FROM orders;

-- 2. ¿QUÉ ESTADOS TIENEN LAS ÓRDENES?
SELECT 
    status as estado,
    COUNT(*) as cantidad,
    SUM(total)::numeric(10,2) as total_ventas
FROM orders
GROUP BY status
ORDER BY cantidad DESC;

-- 3. ¿HAY ÓRDENES DEL MES ACTUAL?
SELECT 
    'Órdenes del mes actual' as metrica,
    COUNT(*) as cantidad,
    SUM(total)::numeric(10,2) as total_ventas
FROM orders
WHERE created_at >= DATE_TRUNC('month', NOW());

-- 4. ¿QUÉ DEVUELVE LA FUNCIÓN get_dashboard_kpis()?
SELECT * FROM get_dashboard_kpis();

-- 5. ¿QUÉ DEVUELVE LA FUNCIÓN get_sales_daily()?
SELECT * FROM get_sales_daily() LIMIT 5;

-- 6. VERIFICAR SI HAY ÓRDENES COMPLETED O PAID DEL MES
SELECT 
    'Órdenes completed/paid del mes' as metrica,
    COUNT(*) as cantidad,
    SUM(total)::numeric(10,2) as total_ventas
FROM orders
WHERE status IN ('completed', 'paid')
  AND created_at >= DATE_TRUNC('month', NOW());

-- 7. VER TODAS LAS ÓRDENES DEL MES (CUALQUIER ESTADO)
SELECT 
    id,
    status,
    total,
    created_at,
    DATE_TRUNC('month', created_at) as mes
FROM orders
WHERE created_at >= DATE_TRUNC('month', NOW())
ORDER BY created_at DESC
LIMIT 10;

-- 8. VERIFICAR DEFINICIÓN DE LA FUNCIÓN
SELECT 
    proname as nombre_funcion,
    pg_get_functiondef(oid) as definicion
FROM pg_proc
WHERE proname = 'get_dashboard_kpis';
