-- =========================================================
-- REPARACIÓN DE INFRAESTRUCTURA DE SUPABASE (EXTREMO)
-- =========================================================

BEGIN;

-- 1. REPARAR PERMISOS DEL ESQUEMA 'auth' (Suele romperse)
GRANT USAGE ON SCHEMA auth TO postgres, service_role, anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO postgres, service_role;

-- 2. REPARAR PERMISOS ESPECÍFICOS PARA EL USUARIO DE SERVICIO
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 3. REPARAR PERMISOS PARA EL ROL ANÓNIMO (LOGIN PÚBLICO)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 4. ELIMINAR CUALQUIER TRIGGER DE AUTH QUE QUEDE VIVO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_login();

-- 5. FORZAR UN 'ANALYZE' PARA ACTUALIZAR ESTADÍSTICAS Y CACHÉ
ANALYZE public.profiles;
ANALYZE public.shifts;

-- 6. RECARGAR POSTGREST
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ INFRAESTRUCTURA REPARADA - INTENTA LOGIN AHORA' as estado;
