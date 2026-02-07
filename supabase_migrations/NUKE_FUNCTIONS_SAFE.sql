-- =========================================================
-- ELIMINACIÓN DE FUNCIONES "PODRIDAS" (CORREGIDO)
-- =========================================================

BEGIN;

-- 1. ELIMINAR FUNCIONES CONOCIDAS UNA POR UNA (PARA EVITAR ERRORES)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_login() CASCADE;
DROP FUNCTION IF EXISTS public.sync_profile() CASCADE;
DROP FUNCTION IF EXISTS public.create_new_order(jsonb) CASCADE;

-- 2. ELIMINAR FUNCIONES DE REPORTES (Las que modificamos recientemente)
DROP FUNCTION IF EXISTS public.get_dashboard_kpis(timestamptz) CASCADE;
DROP FUNCTION IF EXISTS public.get_sales_daily() CASCADE;
DROP FUNCTION IF EXISTS public.get_top_products() CASCADE;
DROP FUNCTION IF EXISTS public.get_low_stock_items() CASCADE;
DROP FUNCTION IF EXISTS public.get_waiter_performance(timestamptz, timestamptz) CASCADE;
DROP FUNCTION IF EXISTS public.get_kitchen_stats(timestamptz, timestamptz) CASCADE;

-- 3. ELIMINACIÓN DINÁMICA (CORREGIDA)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.oid::regprocedure as sig
        FROM pg_proc p
        JOIN pg_namespace ns ON p.pronamespace = ns.oid
        WHERE ns.nspname = 'public'
    ) LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig || ' CASCADE';
            RAISE NOTICE '🔥 Función eliminada: %', r.sig;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️ No se pudo borrar % (probablemente del sistema): %', r.sig, SQLERRM;
        END;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ FUNCIONES ELIMINADAS. SI ESTO NO ARREGLA EL ESQUEMA, ME CORTO UN CABLE.' as estado;
