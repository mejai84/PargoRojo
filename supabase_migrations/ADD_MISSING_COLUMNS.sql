-- =========================================================
-- AGREGAR COLUMNAS FALTANTES A PROFILES
-- Objetivo: Asegurar que document_id y hire_date existen
-- =========================================================

BEGIN;

-- 1. Agregar columnas si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'document_id') THEN
        ALTER TABLE public.profiles ADD COLUMN document_id TEXT;
        RAISE NOTICE 'Columna document_id creada.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'hire_date') THEN
        ALTER TABLE public.profiles ADD COLUMN hire_date DATE DEFAULT CURRENT_DATE;
        RAISE NOTICE 'Columna hire_date creada.';
    END IF;
END $$;

-- 2. Asegurar permisos sobre las nuevas columnas
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;

-- 3. Recargar el esquema obligatoriamente
NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT '✅ ESTRUCTURA ACTUALIZADA. Intenta crear el empleado de nuevo.' as estado;
