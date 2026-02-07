-- =========================================================
-- REPARACIÓN SEGURA DE PERMISOS (SAFE MODE)
-- Objetivo: Restaurar acceso de PostgREST sin tocar sistema protegido
-- =========================================================

BEGIN;

-- 1. Asegurar search_path para el rol authenticator
-- Esto le dice a la API dónde buscar las tablas
ALTER ROLE authenticator SET search_path TO public, extensions, auth;

-- 2. Conceder uso del esquema PUBLIC
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- 3. Conceder acceso a todas las tablas actuales en PUBLIC
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Conceder acceso a todas las secuencias (para IDs autoincrementales)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 5. Conceder acceso a todas las rutinas/funciones
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 6. CRÍTICO: Permisos sobre information_schema
-- PostgREST necesita esto para "ver" la estructura de la base de datos
GRANT USAGE ON SCHEMA information_schema TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO anon, authenticated, service_role;

-- 7. Configurar privilegios por defecto para futuras tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 8. Notificar recarga a PostgREST
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT '✅ PERMISOS SEGUROS APLICADOS. Intenta el login en 30 segundos.' as estado;
