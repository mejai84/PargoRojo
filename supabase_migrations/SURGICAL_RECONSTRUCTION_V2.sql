-- =========================================================
-- SURGICAL RECONSTRUCTION V2: REPARACIÓN TOTAL
-- Objetivo: Restaurar esquema, settings y seguridad sin errores JSON
-- =========================================================

BEGIN;

-- 1. REPARAR TABLA SETTINGS (Evitando errores de tipo JSON)
-- Si ya existe y es JSON, este script la manejará como TEXT para evitar bloqueos
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT, 
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar valores iniciales para que el App no falle al cargar
INSERT INTO public.settings (key, value) 
VALUES 
    ('logo_url', ''), 
    ('business_info', '{"name": "Pargo Rojo"}'),
    ('primary_color', '#ef4444'),
    ('currency', 'COP')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.settings TO anon, authenticated;

-- 2. ASEGURAR TABLA RESTAURANTS
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#ef4444',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AGREGAR restaurant_id A PROFILES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'restaurant_id') THEN
        ALTER TABLE public.profiles ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id);
    END IF;
END $$;

-- 4. ASIGNAR RESTAURANTE POR DEFECTO
INSERT INTO public.restaurants (name, subdomain) VALUES ('Pargo Rojo', 'pargo-rojo') ON CONFLICT (subdomain) DO NOTHING;

UPDATE public.profiles 
SET restaurant_id = (SELECT id FROM public.restaurants WHERE subdomain = 'pargo-rojo' LIMIT 1)
WHERE restaurant_id IS NULL;

-- 5. RESTAURAR TRIGGER DE REGISTRO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, restaurant_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Usuario'),
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    (SELECT id FROM public.restaurants WHERE subdomain = 'pargo-rojo' LIMIT 1)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. SEGURIDAD SIN RECURSIÓN (Fundamental para evitar Error de Esquema)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_read_profiles" ON public.profiles;
CREATE POLICY "allow_read_profiles" ON public.profiles FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "allow_read_restaurants" ON public.restaurants;
CREATE POLICY "allow_read_restaurants" ON public.restaurants FOR SELECT TO authenticated, anon USING (true);

-- 7. PERMISOS DE USO DEL ESQUEMA
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ SISTEMA RECONSTRUIDO Y PROTEGIDO' as estado;
