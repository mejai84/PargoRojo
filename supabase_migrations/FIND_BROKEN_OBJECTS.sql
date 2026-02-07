-- =========================================================
-- BUSCADOR DE OBJETOS ROTOS (ZOMBIES)
-- Fecha: 7 de febrero de 2026
-- Objetivo: Encontrar vistas o funciones inválidas que bloquean PostgREST
-- =========================================================

DO $$
DECLARE
    r RECORD;
    v_count INT;
BEGIN
    RAISE NOTICE '🔍 Iniciando búsqueda de objetos rotos...';

    -- 1. VERIFICAR VISTAS (VIEWS)
    -- Intentamos leer 0 filas de cada vista. Si falla, la vista está rota.
    FOR r IN (SELECT table_schema, table_name FROM information_schema.views WHERE table_schema = 'public') LOOP
        BEGIN
            EXECUTE 'SELECT 1 FROM ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || ' LIMIT 0';
            RAISE NOTICE '✅ Vista OK: %.%', r.table_schema, r.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌❌❌ VISTA ROTA DETECTADA: %.% - %', r.table_schema, r.table_name, SQLERRM;
            -- Opcional: Borrarla si está rota (Descomentar si quieres ser agresivo)
            -- EXECUTE 'DROP VIEW ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || ' CASCADE';
        END;
    END LOOP;

    -- 2. VERIFICAR TRIGGERS FANTASMAS EN AUTH.USERS
    -- A veces quedan triggers "huerfanos"
    FOR r IN (SELECT trigger_name FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users') LOOP
        RAISE NOTICE '⚠️ TRIGGER EN AUTH.USERS DETECTADO: %', r.trigger_name;
    END LOOP;

    -- 3. INTENTO DE LECTURA MANUAL DE TABLAS CRÍTICAS
    BEGIN
        SELECT count(*) INTO v_count FROM public.profiles;
        RAISE NOTICE '✅ Tabla public.profiles accesible (% filas)', v_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR LEYENDO PROFILES: %', SQLERRM;
    END;

    RAISE NOTICE '🏁 Diagnóstico finalizado.';
END $$;
