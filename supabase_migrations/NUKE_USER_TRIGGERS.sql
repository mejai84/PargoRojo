-- =========================================================
-- ELIMINACIÓN QUIRÚRGICA DE TRIGGERS CORRUPTOS
-- Fecha: 7 de febrero de 2026
-- Objetivo: Borrar solo triggers de usuario, sin tocar RI (System)
-- =========================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Buscar triggers en PROFILES que NO sean de sistema (ConstraintTriggers)
    FOR r IN (
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'public.profiles'::regclass 
        AND tgisinternal = false  -- Solo triggers de usuario
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON public.profiles';
        RAISE NOTICE '🔥 Eliminado trigger perfil: %', r.tgname;
    END LOOP;

    -- 2. Buscar triggers en SHIFTS que NO sean de sistema
    FOR r IN (
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'public.shifts'::regclass 
        AND tgisinternal = false
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON public.shifts';
        RAISE NOTICE '🔥 Eliminado trigger turno: %', r.tgname;
    END LOOP;

    -- 3. Buscar y eliminar triggers en AUTH.USERS (si existen)
    FOR r IN (
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON auth.users';
        RAISE NOTICE '🔥 Eliminado trigger auth: %', r.trigger_name;
    END LOOP;

    -- 4. ELIMINAR FUNCIONES QUE SEGURO ESTÁN ROTAS
    -- Usamos CASCADE para borrar triggers asociados si quedara alguno
    DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
    DROP FUNCTION IF EXISTS public.handle_user_login() CASCADE;
    DROP FUNCTION IF EXISTS public.sync_profile() CASCADE;
    
    RAISE NOTICE '✅ Limpieza de triggers de usuario completada.';
END $$;

-- 5. RECARGAR POSTGREST
NOTIFY pgrst, 'reload config';

-- =========================================================
SELECT '✅ TRIGGERS DE USUARIO ELIMINADOS - PRUEBA LOGIN AHORA' as estado;
