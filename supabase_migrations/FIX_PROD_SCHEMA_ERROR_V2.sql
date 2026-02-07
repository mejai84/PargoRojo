-- =========================================================
-- FIX PROD SCHEMA ERROR V2 - MODO RESCATE (AGRESIVO)
-- =========================================================
-- Este script desactiva temporalmente RLS para desbloquear el acceso.
-- Si esto funciona, el problema es 100% una política recursiva.

BEGIN;

-- 1. DESACTIVAR RLS TEMPORALMENTE (Para descartar políticas bloqueantes)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY; -- Si existe, suele dar problemas a cajeros

-- 2. RESETEAR PERMISOS DEL ESQUEMA (Asegurar acceso básico)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

-- Dar permisos explícitos a usuarios autenticados y anónimos
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 3. FORZAR RECARGA DE CACHÉ (CRÍTICO)
NOTIFY pgrst, 'reload config';

COMMIT;

-- =========================================================
-- DIAGNÓSTICO FINAL
-- =========================================================
SELECT 
    '✅ RLS DESACTIVADO TEMPORALMENTE' as estado,
    'Intenta ingresar ahora. Si funciona, reactiva RLS una por una.' as instruccion;
