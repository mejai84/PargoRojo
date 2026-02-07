-- =========================================================
-- 🚑 REPARACIÓN DE EXTENSIONES Y PERMISOS BÁSICOS
-- Objetivo: Asegurar que las herramientas base de Supabase funcionen
-- =========================================================

BEGIN;

-- 1. ASEGURAR EXTENSIONES (Sin esto, gen_random_uuid falla y rompe el login)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA extensions;

-- 2. REPARAR PERMISOS DEL ESQUEMA PUBLIC (A veces se pierden)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. REPARAR PERMISOS SOBRE TODAS LAS TABLAS
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- 4. REPARAR PERMISOS SOBRE TODAS LAS SECUENCIAS
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 5. REPARAR PERMISOS SOBRE TODAS LAS FUNCIONES (Las que quedan)
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 6. RECARGAR POSTGREST (La API)
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ EXTENSIONES Y PERMISOS RESTAURADOS. PRUEBA AHORA.' as estado;
