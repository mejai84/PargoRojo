-- =========================================================
-- SCRIPT DE VERIFICACIÓN DE ESTADO DE MIGRACIONES
-- Ejecutar en Supabase Dashboard > SQL Editor
-- Fecha: 7 de febrero de 2026
-- =========================================================

-- Este script verifica qué funciones y tablas críticas existen
-- para determinar qué migraciones han sido aplicadas

-- =========================================================
-- 1. VERIFICAR FUNCIONES ANALÍTICAS (Migración 122)
-- =========================================================

DO $$
DECLARE
    funcs TEXT[];
BEGIN
    RAISE NOTICE '=== VERIFICACIÓN DE FUNCIONES ANALÍTICAS ===';
    
    -- Listar funciones que deberían existir después de migración 122
    funcs := ARRAY[
        'get_sales_daily',
        'get_sales_by_category',
        'get_top_products',
        'get_dashboard_kpis',
        'get_sales_by_date_range',
        'get_avg_preparation_time',
        'get_sales_by_payment_method'
    ];
    
    FOR i IN 1..array_length(funcs, 1) LOOP
        IF EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = funcs[i]
        ) THEN
            RAISE NOTICE '✅ Función % existe', funcs[i];
        ELSE
            RAISE NOTICE '❌ Función % NO EXISTE - Aplicar migración 122', funcs[i];
        END IF;
    END LOOP;
END $$;

-- =========================================================
-- 2. VERIFICAR COLUMNAS CRÍTICAS (Migración 121)
-- =========================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICACIÓN DE COLUMNAS CRÍTICAS ===';
    
    -- Verificar waiter_id en orders
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'waiter_id'
    ) THEN
        RAISE NOTICE '✅ Columna orders.waiter_id existe';
    ELSE
        RAISE NOTICE '❌ Columna orders.waiter_id NO EXISTE - Aplicar migración 121';
    END IF;
    
    -- Verificar notes en order_items
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'notes'
    ) THEN
        RAISE NOTICE '✅ Columna order_items.notes existe';
    ELSE
        RAISE NOTICE '❌ Columna order_items.notes NO EXISTE - Aplicar migración 121';
    END IF;
    
    -- Verificar tabla receipts
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'receipts'
    ) THEN
        RAISE NOTICE '✅ Tabla receipts existe';
    ELSE
        RAISE NOTICE '❌ Tabla receipts NO EXISTE - Aplicar migración 121';
    END IF;
    
    -- Verificar tabla table_transfers
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'table_transfers'
    ) THEN
        RAISE NOTICE '✅ Tabla table_transfers existe';
    ELSE
        RAISE NOTICE '❌ Tabla table_transfers NO EXISTE - Aplicar migración 121';
    END IF;
END $$;

-- =========================================================
-- 3. VERIFICAR POLÍTICAS RLS DE TABLA TABLES
-- =========================================================

DO $$
DECLARE
    policy_count INTEGER;
    rec RECORD;  -- Variable para el bucle FOR
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== POLÍTICAS RLS DE TABLA TABLES ===';
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'tables';
    
    RAISE NOTICE 'Total de políticas en tabla tables: %', policy_count;
    
    -- Mostrar las políticas existentes
    FOR rec IN (
        SELECT policyname, cmd, qual::text 
        FROM pg_policies 
        WHERE tablename = 'tables'
    ) LOOP
        RAISE NOTICE 'Política: % | Comando: % | Condición: %', 
            rec.policyname, rec.cmd, rec.qual;
    END LOOP;
    
    -- Verificar si hay política UPDATE para admin
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tables' 
        AND cmd = 'UPDATE'
    ) THEN
        RAISE NOTICE '✅ Existe política UPDATE para tabla tables';
    ELSE
        RAISE NOTICE '⚠️ NO existe política UPDATE para tabla tables - Esto puede causar problemas';
    END IF;
END $$;

-- =========================================================
-- 4. VERIFICAR COLUMNAS DE POSICIÓN EN TABLA TABLES
-- =========================================================

DO $$
DECLARE
    col_names TEXT[];  -- Renombrado de 'columns' para evitar conflicto
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== COLUMNAS DE POSICIÓN EN TABLA TABLES ===';
    
    col_names := ARRAY['x_pos', 'y_pos', 'width', 'height', 'rotation', 'shape'];
    
    FOR i IN 1..array_length(col_names, 1) LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tables' AND column_name = col_names[i]
        ) THEN
            RAISE NOTICE '✅ Columna tables.% existe', col_names[i];
        ELSE
            RAISE NOTICE '❌ Columna tables.% NO EXISTE', col_names[i];
        END IF;
    END LOOP;
END $$;

-- =========================================================
-- 5. VERIFICAR FUNCIONES DE TRANSFERENCIA (Migración 121)
-- =========================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FUNCIONES DE TRANSFERENCIA DE MESAS ===';
    
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'transfer_order_to_table'
    ) THEN
        RAISE NOTICE '✅ Función transfer_order_to_table existe';
    ELSE
        RAISE NOTICE '❌ Función transfer_order_to_table NO EXISTE - Aplicar migración 121';
    END IF;
END $$;

-- =========================================================
-- 6. RESUMEN FINAL
-- =========================================================

DO $$
DECLARE
    v_missing_migrations TEXT := '';
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RESUMEN DE MIGRACIONES REQUERIDAS ===';
    
    -- Verificar 121
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'waiter_id') THEN
        v_missing_migrations := v_missing_migrations || '121_production_bugs_fix_part1.sql' || E'\n';
    END IF;
    
    -- Verificar 122
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_dashboard_kpis') THEN
        v_missing_migrations := v_missing_migrations || '122_fix_analytics_functions.sql' || E'\n';
    END IF;
    
    IF v_missing_migrations = '' THEN
        RAISE NOTICE '✅ TODAS LAS MIGRACIONES CRÍTICAS ESTÁN APLICADAS';
    ELSE
        RAISE NOTICE '⚠️ MIGRACIONES PENDIENTES:';
        RAISE NOTICE '%', v_missing_migrations;
    END IF;
END $$;

-- =========================================================
-- FIN DEL SCRIPT DE VERIFICACIÓN
-- =========================================================
