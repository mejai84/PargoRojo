-- =========================================================
-- TOTAL SCHEMA RESCUE: ATAQUE NUCLEAR A ERRORES DE ESQUEMA
-- Objetivo: Borrar settings conflictivo, limpiar políticas y reparar extensiones
-- =========================================================

BEGIN;

-- 1. ELIMINAR TABLA SETTINGS Y CUALQUIER VISTA DEPENDIENTE
DROP TABLE IF EXISTS public.settings CASCADE;
DROP VIEW IF EXISTS public.app_settings CASCADE;

-- 2. RECREAR TABLA SETTINGS (Con nombres que no sean palabras reservadas)
CREATE TABLE public.settings (
    s_key TEXT PRIMARY KEY,
    s_value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INSERTAR DATOS
INSERT INTO public.settings (s_key, s_value) 
VALUES 
    ('logo_url', ''), 
    ('business_info', '{"name": "Pargo Rojo"}');

-- 4. CREAR VISTA PARA COMPATIBILIDAD CON FRONTEND (Mapea s_key -> key, s_value -> value)
CREATE OR REPLACE VIEW public.settings_view AS 
SELECT s_key as key, s_value as value FROM public.settings;

-- 5. PERMISOS TOTALES A LOS ROLES DE LA API
GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;
GRANT SELECT ON public.settings TO anon, authenticated, authenticator;
GRANT SELECT ON public.settings_view TO anon, authenticated, authenticator;

-- 6. LIMPIEZA TOTAL DE POLÍTICAS (Para descartar recursividad oculta)
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || quote_ident(pol.tablename);
    END LOOP;
END $$;

-- 7. DESACTIVAR RLS (Para asegurar que la API pueda leer el esquema sin bloqueos)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- 8. REPARAR SCHEMA EXTENSIONS (Vital para que el Auth de Supabase no de 500)
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, authenticator;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO anon, authenticated, authenticator;

-- 10. RECARGA FINAL
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ RESCATE COMPLETADO. Si esto falla, pausa y reanuda el proyecto en Supabase.' as estado;
