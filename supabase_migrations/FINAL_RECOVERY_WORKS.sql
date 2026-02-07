-- =========================================================
-- FINAL RECOVERY WORKS - CORREGIDO
-- Objetivo: Matar el Error 406 y 400 alineando permisos y esquema
-- =========================================================

BEGIN;

-- 1. REPARAR TABLA SETTINGS (Asegurar columnas key/value con tipo TEXT)
DROP TABLE IF EXISTS public.settings CASCADE;
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos que el frontend pide al cargar
INSERT INTO public.settings (key, value) 
VALUES 
    ('logo_url', ''), 
    ('business_info', '{"name": "Pargo Rojo"}'),
    ('primary_color', '#ef4444');

-- 2. REPARAR EL search_path DE LOS ROLES INTERNOS
-- Esto es CRÍTICO para que la API no pierda el mapa de las tablas
ALTER ROLE authenticator SET search_path TO public, extensions, auth;
ALTER ROLE anon SET search_path TO public, extensions, auth;
ALTER ROLE authenticated SET search_path TO public, extensions, auth;

-- 3. GRANTS DE SISTEMA PARA LA API
GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, authenticator;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, authenticator;

-- 4. DESHABILITAR RLS PARA DEBUGGING (Para asegurar que la API vea el esquema)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;

-- 5. RECARGA FINAL DE LA API
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ RECOBRANDO ACCESO: PERMISOS RESETEADOS' as estado;
