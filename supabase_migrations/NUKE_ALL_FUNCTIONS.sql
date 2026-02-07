-- =========================================================
-- 💣 NUKE ALL FUNCTIONS: ELIMINACIÓN TOTAL DE FUNCIONES
-- Objetivo: Eliminar funciones "podridas" que rompen PostgREST
-- =========================================================

BEGIN;

-- ELIMINAR MANUALMENTE LAS QUE SABEMOS QUE EXISTEN
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_login() CASCADE;
DROP FUNCTION IF EXISTS public.get_dashboard_kpis(timestamptz) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_kpis(timestamptz) CASCADE;
DROP FUNCTION IF EXISTS public.get_sales_daily() CASCADE;
DROP FUNCTION IF EXISTS public.get_top_products() CASCADE;
DROP FUNCTION IF EXISTS public.get_sales_by_payment_method() CASCADE;
DROP FUNCTION IF EXISTS public.get_average_prep_time() CASCADE;
DROP FUNCTION IF EXISTS public.get_hourly_sales() CASCADE;
DROP FUNCTION IF EXISTS public.get_low_stock_items() CASCADE;
DROP FUNCTION IF EXISTS public.check_inventory_availability(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_order_total(uuid) CASCADE;

-- SI QUEDA ALGUNA OTRA, ESTA CONSULTA DINÁMICA LAS BORRARÁ TOOOODAS
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT ns.nspname, p.proname, oid::regprocedure as sig
        FROM pg_proc p
        JOIN pg_namespace ns ON p.pronamespace = ns.oid
        WHERE ns.nspname = 'public'
    ) LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig || ' CASCADE';
            RAISE NOTICE '🔥 Función eliminada: %', r.sig;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️ No se pudo borrar %: %', r.sig, SQLERRM;
        END;
    END LOOP;
END $$;

-- RESTAURAR SCHEMAS BÁSICOS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;

-- RECARGAR
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ TODAS LAS FUNCIONES ELIMINADAS - INTENTA ENTRAR AHORA' as estado;
