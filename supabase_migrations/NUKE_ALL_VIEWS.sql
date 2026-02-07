-- =========================================================
-- 💣 NUKE ALL VIEWS: ELIMINACIÓN TOTAL DE VISTAS
-- Objetivo: Eliminar vistas "zombies" que quedaron tras borrar funciones
-- =========================================================

BEGIN;

-- 1. ELIMINACIÓN DINÁMICA DE TODAS LAS VISTAS EN PUBLIC
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_schema, table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public'
    ) LOOP
        BEGIN
            EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || ' CASCADE';
            RAISE NOTICE '🔥 Vista eliminada: %.%', r.table_schema, r.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️ No se pudo borrar vista %.%: %', r.table_schema, r.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. ASEGURARNOS DE BORRAR MATERIALIZED VIEWS TAMBIÉN
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, matviewname
        FROM pg_matviews
        WHERE schemaname = 'public'
    ) LOOP
        BEGIN
            EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.matviewname) || ' CASCADE';
            RAISE NOTICE '🔥 Vista Materializada eliminada: %.%', r.schemaname, r.matviewname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Error borrando matview: %', SQLERRM;
        END;
    END LOOP;
END $$;

-- 3. RECARGAR EL CACHÉ DE POSTGREST (CRÍTICO)
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ TODAS LAS VISTAS ELIMINADAS. SI ESTO NO FUNCIONA, VOY DONDE TI Y REVISO EL CABLEADO.' as estado;
