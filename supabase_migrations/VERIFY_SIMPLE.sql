-- =========================================================
-- VERIFICACIÓN ULTRA SIMPLE - MIGRACIONES PARGO ROJO
-- Ejecutar en Supabase Dashboard > SQL Editor
-- =========================================================

-- 1. FUNCIONES ANALÍTICAS (Migración 122)
SELECT 
    'get_dashboard_kpis' as funcion,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_dashboard_kpis') 
         THEN '✅ Existe' ELSE '❌ NO EXISTE - Aplicar 122' END as estado
UNION ALL
SELECT 
    'get_sales_daily',
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_sales_daily') 
         THEN '✅ Existe' ELSE '❌ NO EXISTE - Aplicar 122' END
UNION ALL
SELECT 
    'get_top_products',
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_top_products') 
         THEN '✅ Existe' ELSE '❌ NO EXISTE - Aplicar 122' END
UNION ALL
SELECT 
    'get_avg_preparation_time',
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_avg_preparation_time') 
         THEN '✅ Existe' ELSE '❌ NO EXISTE - Aplicar 122' END;

-- 2. COLUMNAS CRÍTICAS (Migración 121)
SELECT 
    'orders.waiter_id' as columna,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'waiter_id') 
         THEN '✅ Existe' ELSE '❌ NO EXISTE - Aplicar 121' END as estado
UNION ALL
SELECT 
    'order_items.notes',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'notes') 
         THEN '✅ Existe' ELSE '❌ NO EXISTE - Aplicar 121' END;

-- 3. TABLAS CRÍTICAS (Migración 121)
SELECT 
    'receipts' as tabla,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receipts') 
         THEN '✅ Existe' ELSE '❌ NO EXISTE - Aplicar 121' END as estado
UNION ALL
SELECT 
    'table_transfers',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'table_transfers') 
         THEN '✅ Existe' ELSE '❌ NO EXISTE - Aplicar 121' END;

-- 4. COLUMNAS DE POSICIÓN (Migración 125)
SELECT 
    'tables.x_pos' as columna,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'x_pos') 
         THEN '✅ Existe' ELSE '❌ NO EXISTE - Aplicar 125' END as estado
UNION ALL
SELECT 
    'tables.y_pos',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'y_pos') 
         THEN '✅ Existe' ELSE '❌ NO EXISTE - Aplicar 125' END
UNION ALL
SELECT 
    'tables.width',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'width') 
         THEN '✅ Existe' ELSE '❌ NO EXISTE - Aplicar 125' END
UNION ALL
SELECT 
    'tables.rotation',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'rotation') 
         THEN '✅ Existe' ELSE '❌ NO EXISTE - Aplicar 125' END;

-- 5. POLÍTICAS RLS DE TABLA TABLES
SELECT 
    policyname as politica,
    cmd::text as comando
FROM pg_policies
WHERE tablename = 'tables';

-- 6. RESUMEN FINAL
SELECT 
    'MIGRACIÓN 121' as migracion,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'waiter_id') 
         THEN '✅ YA APLICADA' ELSE '❌ PENDIENTE - Ejecutar 121_production_bugs_fix_part1.sql' END as estado
UNION ALL
SELECT 
    'MIGRACIÓN 122',
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_dashboard_kpis') 
         THEN '✅ YA APLICADA' ELSE '❌ PENDIENTE - Ejecutar 122_fix_analytics_functions.sql' END
UNION ALL
SELECT 
    'MIGRACIÓN 125',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'x_pos') 
         THEN '✅ YA APLICADA' ELSE '❌ PENDIENTE - Ejecutar 125_fix_tables_rls_and_permissions.sql' END;
