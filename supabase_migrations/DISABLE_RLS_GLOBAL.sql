-- =========================================================
-- APAGÓN GLOBAL DE SEGURIDAD (SOLO DIAGNÓSTICO)
-- Objetivo: Confirmar si el bloqueo es por RLS o Permisos
-- =========================================================

BEGIN;

-- 1. DESACTIVAR RLS EN TODAS LAS TABLAS CRÍTICAS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- 2. OTORGAR PERMISOS EXPLÍCITOS DE USO Y LECTURA
-- A veces el rol 'authenticated' pierde el permiso de usar el esquema public
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- 3. PERMISOS DE SECUENCIAS (Para IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 4. RECARGA DE CONFIGURACIÓN
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '⛔ RLS DESACTIVADO Y PERMISOS OTORGADOS. PRUEBA ENTRAR.' as estado;
