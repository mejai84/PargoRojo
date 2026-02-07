-- =========================================================
-- SURGICAL RECONSTRUCTION V3: SOLUCIÓN ERROR JSON
-- Objetivo: Reparar esquema evitando el error 22P02 de Postgres
-- =========================================================

BEGIN;

-- 1. REPARAR TABLA SETTINGS
-- Forzamos a que la columna se pueda tratar como TEXT para evitar errores de sintaxis JSON
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings' AND table_schema = 'public') THEN
        -- Intentamos convertir la columna a TEXT. CASCADE por si hay vistas (que ya borramos antes).
        ALTER TABLE public.settings ALTER COLUMN value TYPE TEXT;
    ELSE
        CREATE TABLE public.settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            description TEXT,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- 2. INSERTAR VALORES INICIALES (Ahora sí funcionará '')
INSERT INTO public.settings (key, value) 
VALUES 
    ('logo_url', ''), 
    ('business_info', '{"name": "Pargo Rojo"}'),
    ('primary_color', '#ef4444'),
    ('currency', 'COP')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.settings TO anon, authenticated;

-- 3. ASEGURAR TABLA RESTAURANTS
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#ef4444',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AGREGAR restaurant_id A PROFILES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'restaurant_id') THEN
        ALTER TABLE public.profiles ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id);
    END IF;
END $$;

-- 5. ASIGNAR RESTAURANTE POR DEFECTO
INSERT INTO public.restaurants (name, subdomain) VALUES ('Pargo Rojo', 'pargo-rojo') ON CONFLICT (subdomain) DO NOTHING;

UPDATE public.profiles 
SET restaurant_id = (SELECT id FROM public.restaurants WHERE subdomain = 'pargo-rojo' LIMIT 1)
WHERE restaurant_id IS NULL;

-- 6. RESTAURAR TRIGGER DE REGISTRO
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

-- 7. SEGURIDAD RLS BÁSICA (Lectura abierta para evitar Error de Esquema)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_read_profiles_v3" ON public.profiles;
CREATE POLICY "allow_read_profiles_v3" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_read_restaurants_v3" ON public.restaurants;
CREATE POLICY "allow_read_restaurants_v3" ON public.restaurants FOR SELECT USING (true);

-- 8. REPARAR PERMISOS DEL ROL AUTHENTICATOR
GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, authenticator;

NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ RECONSTRUCCIÓN V3 COMPLETADA EXITOSAMENTE' as estado;
