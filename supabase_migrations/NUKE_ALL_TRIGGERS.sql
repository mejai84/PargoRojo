-- =========================================================
-- ☢️ NUKE ALL TRIGGERS: ELIMINACIÓN TOTAL DE AUTOMATIZACIONES
-- Fecha: 7 de febrero de 2026
-- Objetivo: Eliminar cualquier trigger que cause "Database error"
-- =========================================================

BEGIN;

-- 1. LISTAR Y ELIMINAR TRIGGERS EN TABLAS CRÍTICAS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
DROP TRIGGER IF EXISTS on_user_logged_in ON auth.users;

DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
DROP TRIGGER IF EXISTS update_profile_trigger ON public.profiles;
DROP TRIGGER IF EXISTS sync_user_profile ON public.profiles;

DROP TRIGGER IF EXISTS handle_updated_at ON public.shifts;
DROP TRIGGER IF EXISTS on_shift_created ON public.shifts;

-- 2. DESACTIVAR TODOS LOS TRIGGERS DE LA TABLA PROFILES (POR SI ACASO)
ALTER TABLE public.profiles DISABLE TRIGGER ALL;

-- 3. DESACTIVAR TODOS LOS TRIGGERS DE LA TABLA SHIFTS
ALTER TABLE public.shifts DISABLE TRIGGER ALL;

-- 4. ELIMINAR FUNCIONES QUE SUELEN USARSE EN TRIGGERS
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_login() CASCADE;
DROP FUNCTION IF EXISTS public.sync_profile() CASCADE;

-- 5. REPARAR PERMISOS (OTRA VEZ, POR SI LOS TRIGGERS ERAN DE OTRO OWNER)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- 6. RECARGAR
NOTIFY pgrst, 'reload config';

COMMIT;

-- =========================================================
SELECT '☢️ TODOS LOS TRIGGERS ELIMINADOS Y DESACTIVADOS' as estado;
