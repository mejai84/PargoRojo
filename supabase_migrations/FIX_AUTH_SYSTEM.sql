-- =========================================================
-- REPARACIÓN DEL SISTEMA DE AUTH (SYSTEM LEVEL FIX)
-- Objetivo: Reparar pgcrypto y permisos de auth internos
-- =========================================================

BEGIN;

-- 1. Asegurar que las extensiones criptográficas existen (CRÍTICO para login)
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- 2. Conceder acceso a extensions (donde viven las funciones de hash)
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role, dashboard_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO anon, authenticated, service_role, dashboard_user;

-- 3. Reparar permisos del esquema AUTH (Donde están los usuarios)
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role, postgres, dashboard_user;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO postgres, dashboard_user, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres; -- Superusuario necesita control total

-- 4. Asegurar que el rol authenticator sepa dónde buscar
ALTER ROLE authenticator SET search_path TO public, extensions, auth;
ALTER DATABASE postgres SET search_path TO public, extensions, auth;

-- 5. Recarga final
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ SISTEMA DE AUTH REPARADO. Intenta login.' as estado;
