-- =========================================================
-- CORRECCIÓN DE ESTADOS DE ÓRDENES PARA REPORTES
-- Este script actualiza los estados de las órdenes existentes
-- para que sean detectadas por las funciones de analytics
-- =========================================================

-- ANTES DE EJECUTAR: Ver el estado actual
SELECT 
    'ANTES DE CAMBIOS' as momento,
    status,
    COUNT(*) as cantidad,
    SUM(total)::numeric(10,2) as total_ventas
FROM orders
GROUP BY status
ORDER BY cantidad DESC;

-- =========================================================
-- ACTUALIZAR ESTADOS
-- =========================================================

-- 1. Cambiar 'delivered' a 'completed' (órdenes entregadas son ventas completadas)
UPDATE orders
SET status = 'completed'
WHERE status = 'delivered';

-- 2. Cambiar 'ready' a 'completed' (órdenes listas también son ventas completadas)
UPDATE orders
SET status = 'completed'
WHERE status = 'ready';

-- DESPUÉS DE EJECUTAR: Ver el nuevo estado
SELECT 
    'DESPUÉS DE CAMBIOS' as momento,
    status,
    COUNT(*) as cantidad,
    SUM(total)::numeric(10,2) as total_ventas
FROM orders
GROUP BY status
ORDER BY cantidad DESC;

-- =========================================================
-- VERIFICAR RESULTADO DE LA FUNCIÓN
-- =========================================================

SELECT 
    '🎯 RESULTADO CORREGIDO' as titulo,
    total_revenue_month,
    total_orders_month,
    avg_ticket,
    total_customers
FROM get_dashboard_kpis();

-- =========================================================
-- RESUMEN
-- =========================================================

SELECT 
    '✅ CORRECCIÓN APLICADA' as resultado,
    'Órdenes "delivered" y "ready" ahora son "completed"' as cambio,
    'Los reportes ahora deberían mostrar datos reales' as impacto;
