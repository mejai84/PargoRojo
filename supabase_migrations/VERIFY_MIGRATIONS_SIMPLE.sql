-- =========================================================
-- SCRIPT DE VERIFICACIÓN SIMPLE (CON RESULTADOS VISIBLES)
-- Ejecutar en Supabase Dashboard > SQL Editor
-- Fecha: 7 de febrero de 2026
-- =========================================================

-- Este script muestra resultados directamente en tablas

-- =========================================================
-- 1. VERIFICAR FUNCIONES ANALÍTICAS (Migración 122)
-- =========================================================

SELECT 
    'Funciones Analíticas' as categoria,
    unnest(ARRAY[
        'get_sales_daily',
        'get_sales_by_category',
        'get_top_products',
        'get_dashboard_kpis',
        'get_sales_by_date_range',
        'get_avg_preparation_time',
        'get_sales_by_payment_method'
    ]) as nombre_funcion,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = unnest(ARRAY[
                'get_sales_daily',
                'get_sales_by_category',
                'get_top_products',
                'get_dashboard_kpis',
                'get_sales_by_date_range',
                'get_avg_preparation_time',
                'get_sales_by_payment_method'
            ])
        ) THEN '✅ Existe'
        ELSE '❌ NO EXISTE - Aplicar 122'
    END as estado;

-- =========================================================
-- 2. VERIFICAR COLUMNAS CRÍTICAS (Migración 121)
-- =========================================================

SELECT 
    'Columnas Críticas' as categoria,
    tabla || '.' || columna as elemento,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_name = tabla AND c.column_name = columna
        ) THEN '✅ Existe'
        ELSE '❌ NO EXISTE - Aplicar 121'
    END as estado
FROM (
    VALUES 
        ('orders', 'waiter_id'),
        ('order_items', 'notes')
) AS t(tabla, columna);

-- =========================================================
-- 3. VERIFICAR TABLAS CRÍTICAS (Migración 121)
-- =========================================================

SELECT 
    'Tablas Críticas' as categoria,
    tabla as elemento,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables t
            WHERE t.table_name = tabla
        ) THEN '✅ Existe'
        ELSE '❌ NO EXISTE - Aplicar 121'
    END as estado
FROM (
    VALUES 
        ('receipts'),
        ('table_transfers')
) AS t(tabla);

-- =========================================================
-- 4. VERIFICAR POLÍTICAS RLS DE TABLA TABLES
-- =========================================================

SELECT 
    'Políticas RLS' as categoria,
    'Tabla: tables' as elemento,
    COUNT(*)::text || ' políticas activas' as estado
FROM pg_policies
WHERE tablename = 'tables';

-- Detalle de políticas
SELECT 
    'Política RLS Detalle' as categoria,
    policyname as elemento,
    cmd::text as estado
FROM pg_policies
WHERE tablename = 'tables';

-- =========================================================
-- 5. VERIFICAR COLUMNAS DE POSICIÓN (Migración 125)
-- =========================================================

SELECT 
    'Columnas de Posición' as categoria,
    'tables.' || col as elemento,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_name = 'tables' AND c.column_name = col
        ) THEN '✅ Existe'
        ELSE '❌ NO EXISTE - Aplicar 125'
    END as estado
FROM (
    VALUES 
        ('x_pos'),
        ('y_pos'),
        ('width'),
        ('height'),
        ('rotation'),
        ('shape')
) AS t(col);

-- =========================================================
-- 6. RESUMEN FINAL - MIGRACIONES REQUERIDAS
-- =========================================================

SELECT 
    '🎯 RESUMEN FINAL' as categoria,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'waiter_id') 
        THEN '❌ Aplicar migración 121_production_bugs_fix_part1.sql'
        ELSE '✅ Migración 121 ya aplicada'
    END as migracion_121;

SELECT 
    '🎯 RESUMEN FINAL' as categoria,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_dashboard_kpis')
        THEN '❌ Aplicar migración 122_fix_analytics_functions.sql'
        ELSE '✅ Migración 122 ya aplicada'
    END as migracion_122;

SELECT 
    '🎯 RESUMEN FINAL' as categoria,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'x_pos')
        THEN '❌ Aplicar migración 125_fix_tables_rls_and_permissions.sql'
        ELSE '✅ Migración 125 ya aplicada'
    END as migracion_125;

-- =========================================================
-- FIN DEL SCRIPT DE VERIFICACIÓN SIMPLE
-- =========================================================
