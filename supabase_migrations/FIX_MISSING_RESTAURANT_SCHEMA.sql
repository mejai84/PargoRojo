-- =========================================================
-- SOLUCIÓN FINAL: CREAR ESQUEMA DE RESTAURANTES FALTANTE
-- Fecha: 7 de febrero de 2026
-- Objetivo: Agregar tablas y columnas que el Frontend busca y no encuentra
-- =========================================================

BEGIN;

-- 1. CREAR TABLA 'restaurants' SI NO EXISTE
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#ef4444', -- Rojo por defecto
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HABILITAR RLS EN RESTAURANTS (Seguridad)
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- 3. PERMITIR LECTURA PÚBLICA DE RESTAURANTES (Es necesario para el Login/Home)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.restaurants;
CREATE POLICY "restaurants_read_all" ON public.restaurants FOR SELECT TO authenticated, anon USING (true);

-- 4. AGREGAR COLUMNA 'restaurant_id' A PROFILES
-- Usamos DO block para evitar error si ya existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'restaurant_id') THEN
        ALTER TABLE public.profiles ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id);
        RAISE NOTICE '✅ Columna restaurant_id agregada a profiles';
    END IF;
END $$;

-- 5. CREAR RESTAURANTE POR DEFECTO "Pargo Rojo"
INSERT INTO public.restaurants (name, subdomain, primary_color)
VALUES ('Pargo Rojo', 'pargo-rojo', '#ef4444')
ON CONFLICT (subdomain) DO NOTHING;

-- 6. ASIGNAR ESTE RESTAURANTE A TODOS LOS PERFILES EXISTENTES
-- (Incluida Ana)
UPDATE public.profiles
SET restaurant_id = (SELECT id FROM public.restaurants WHERE subdomain = 'pargo-rojo' LIMIT 1)
WHERE restaurant_id IS NULL;

-- 7. OTORGAR PERMISOS
GRANT ALL ON public.restaurants TO postgres, service_role;
GRANT SELECT ON public.restaurants TO anon, authenticated;

-- 8. RECARGAR CACHÉ
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ ESQUEMA CORREGIDO: Tabla restaurants y columna restaurant_id creadas.' as estado;
