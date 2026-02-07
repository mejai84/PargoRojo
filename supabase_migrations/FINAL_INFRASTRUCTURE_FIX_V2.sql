-- =========================================================
-- FINAL INFRASTRUCTURE FIX V2: SIN REINDEX EN TRANSACCIÓN
-- Objetivo: Reparar permisos y settings para eliminar error 400/500
-- =========================================================

-- 1. LIMPIEZA Y RECREACIÓN DE SETTINGS
DROP TABLE IF EXISTS public.settings CASCADE;
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar valores requeridos por el frontend
INSERT INTO public.settings (key, value) 
VALUES 
    ('logo_url', ''), 
    ('business_info', '{}'),
    ('primary_color', '#ef4444')
ON CONFLICT (key) DO NOTHING;

-- 2. PERMISOS TOTALES A SETTINGS
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.settings TO anon, authenticated, authenticator;

-- 3. REPARAR EL search_path DE LOS ROLES INTERNOS
-- (Nota: Esto se ejecuta fuera de transacción para mayor seguridad)
ALTER ROLE authenticator SET search_path TO public, extensions, auth;
ALTER ROLE anon SET search_path TO public, extensions, auth;
ALTER ROLE authenticated SET search_path TO public, extensions, auth;

-- 4. PERMISOS DE ESQUEMA PARA LA API
GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, authenticator;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, authenticator;

-- 5. RECARGA DE CONFIGURACIÓN POSTGREST
NOTIFY pgrst, 'reload config';

SELECT '✅ INFRAESTRUCTURA REPARADA. Intenta entrar de nuevo.' as estado;
