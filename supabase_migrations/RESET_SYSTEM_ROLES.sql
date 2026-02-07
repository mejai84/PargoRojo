-- =========================================================
-- RESETEO DE ROLES DEL SISTEMA Y SEARCH_PATH
-- Objetivo: Decirle a Supabase dónde están las tablas (Arregla Error 400/500)
-- =========================================================

BEGIN;

-- 1. ARREGLAR SEARCH_PATH PARA TODOS LOS ROLES (Uno por uno)
-- Authenticator (El portero de la API)
ALTER ROLE authenticator SET search_path TO public, extensions, auth;
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT USAGE ON SCHEMA extensions TO authenticator;

-- Anon (Usuario no logueado)
ALTER ROLE anon SET search_path TO public, extensions, auth;
GRANT USAGE ON SCHEMA public TO anon;

-- Authenticated (Usuario logueado)
ALTER ROLE authenticated SET search_path TO public, extensions, auth;
GRANT USAGE ON SCHEMA public TO authenticated;

-- PostgreSQL (Admin)
ALTER ROLE postgres SET search_path TO public, extensions, auth;

-- Service Role (Superusuario de API)
ALTER ROLE service_role SET search_path TO public, extensions, auth;
GRANT USAGE ON SCHEMA public TO service_role;

-- 2. RESETEAR PERMISOS DE AUTH (GoTrue)
-- Este usuario es el que ejecuta el login
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;

-- 3. PERMISOS SOBRE FUNCIONES MAGICAS (Extensiones)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 4. RECARGA FINAL
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ ROLES SISTEMA RECONFIGURADOS. INTENTA PING A LA DB.' as estado;
