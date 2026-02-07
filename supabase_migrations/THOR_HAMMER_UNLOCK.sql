-- =========================================================
-- ⚡ MARTILLO DE THOR: DESBLOQUEO TOTAL Y ABSOLUTO ⚡
-- Fecha: 7 de febrero de 2026
-- Objetivo: Restablecer permisos y eliminar CUALQUIER BLOQUEO
-- =========================================================

BEGIN;

-- 1. ELIMINAR TODAS LAS POLÍTICAS DE PROFILES Y SHIFTS (LIMPIEZA TOTAL)
DROP POLICY IF EXISTS "profiles_read_simple" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "profiles_select_safe" ON profiles;
DROP POLICY IF EXISTS "profiles_read_all_auth" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "shifts_read_policy" ON shifts;
DROP POLICY IF EXISTS "shifts_select_own" ON shifts;
DROP POLICY IF EXISTS "shifts_insert_own" ON shifts;
DROP POLICY IF EXISTS "shifts_update_own" ON shifts;
DROP POLICY IF EXISTS "shifts_all_admin" ON shifts;

-- 2. DESACTIVAR RLS (Solo por precaución, aunque sin políticas es igual)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;

-- 3. RESTABLECER PERMISOS DEL ESQUEMA 'public' (CRÍTICO)
-- A veces se pierden y nadie puede leer nada
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 4. OTORGAR TODOS LOS PERMISOS EN TODAS LAS TABLAS
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- 5. OTORGAR TODOS LOS PERMISOS EN TODAS LAS SECUENCIAS (Para IDs autoincrementales)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 6. OTORGAR TODOS LOS PERMISOS EN TODAS LAS FUNCIONES (RPCs)
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 7. REINICIAR PRIVILEGIOS POR DEFECTO (Para tablas futuras)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;

-- 8. FORZAR RECARGA DE CACHÉ DE LA API
NOTIFY pgrst, 'reload config';

COMMIT;

-- =========================================================
SELECT '⚡ MARTILLO DE THOR EJECUTADO - TODO ABIERTO' as estado;
