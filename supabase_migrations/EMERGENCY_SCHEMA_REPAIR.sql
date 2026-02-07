-- =========================================================
-- EMERGENCY SCHEMA REPAIR: TABLA SETTINGS Y PERMISOS AUTH
-- Objetivo: Crear la tabla settings que el frontend pide y limpiar permisos
-- =========================================================

BEGIN;

-- 1. CREAR TABLA SETTINGS (El error 400 en consola muestra que se requiere)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ASEGURAR VALORES BÁSICOS
INSERT INTO public.settings (key, value) 
VALUES 
    ('logo_url', ''), 
    ('business_info', '{"name": "Pargo Rojo"}'),
    ('primary_color', '#ef4444')
ON CONFLICT (key) DO NOTHING;

-- 3. PERMISOS TOTALES SOBRE SETTINGS (Sin RLS para pruebas)
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO postgres, service_role;

-- 4. REPARAR PROFILES Y RESTAURANTS (Dueño)
ALTER TABLE public.profiles OWNER TO postgres;
ALTER TABLE public.restaurants OWNER TO postgres;

-- 5. RE-HABILITAR PERMISOS DE LOGIN (Supabase Auth Admin)
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;
GRANT ALL ON TABLE public.restaurants TO supabase_auth_admin;

-- 6. RECARGAR API
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ REPARACIÓN DE EMERGENCIA COMPLETADA' as estado;
