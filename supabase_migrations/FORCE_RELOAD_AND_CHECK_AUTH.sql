-- =========================================================
-- REINICIO DE PERMISOS AUTH y CACHÉ
-- Objetivo: Forzar a PostgREST a "olvidar" el esquema viejo
-- =========================================================

BEGIN;

-- 1. CAMBIAR MOMENTÁNEAMENTE EL SEARCH_PATH
-- Esto obliga a renovar conexiones
ALTER ROLE authenticator SET search_path TO public, extensions;

-- 2. RESETEAR DUEÑO DE TABLAS (A veces ayuda)
ALTER TABLE public.profiles OWNER TO postgres;
ALTER TABLE public.restaurants OWNER TO postgres;

-- 3. RE-OTORGAR PERMISOS AUTHENTICATOR (El usuario web)
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticator;

-- 4. RECARGA FINAL
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ Configuración de Authenticator renovada.' as estado;
