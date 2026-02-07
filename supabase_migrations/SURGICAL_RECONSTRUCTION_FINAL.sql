-- =========================================================
-- RECONSTRUCCIÓN QUIRÚRGICA FINAL
-- Objetivo: Restaurar restaurant_id, Triggers y RLS Seguro
-- =========================================================

BEGIN;

-- 1. ASEGURAR TABLA RESTAURANTS
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#ef4444',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AGREGAR COLUMNA restaurant_id A PROFILES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'restaurant_id') THEN
        ALTER TABLE public.profiles ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id);
        RAISE NOTICE '✅ Columna restaurant_id añadida.';
    END IF;
END $$;

-- 3. CREAR RESTAURANTE POR DEFECTO Y ASIGNARLO
INSERT INTO public.restaurants (name, subdomain) 
VALUES ('Pargo Rojo', 'pargo-rojo') 
ON CONFLICT (subdomain) DO NOTHING;

UPDATE public.profiles 
SET restaurant_id = (SELECT id FROM public.restaurants WHERE subdomain = 'pargo-rojo' LIMIT 1)
WHERE restaurant_id IS NULL;

-- 4. RESTAURAR FUNCIÓN DE NUEVO USUARIO (SÍ funcionará ahora que existe la columna)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    default_res_id UUID;
BEGIN
  -- Obtener el ID del restaurante por defecto
  SELECT id INTO default_res_id FROM public.restaurants WHERE subdomain = 'pargo-rojo' LIMIT 1;

  INSERT INTO public.profiles (id, email, full_name, role, restaurant_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Usuario'),
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    default_res_id
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RECREAR TRIGGER EN AUTH.USERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. REACTIVAR RLS Y POLÍTICAS LIMPIAS (Para evitar recursión infinita)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Política de lectura: Todos pueden ver perfiles (Necesario para el login y equipo)
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT TO authenticated, anon USING (true);

-- Política de actualización: Solo el dueño actualiza su perfil
DROP POLICY IF EXISTS "profiles_owner_update" ON public.profiles;
CREATE POLICY "profiles_owner_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Política de restaurantes: Lectura pública
DROP POLICY IF EXISTS "restaurants_public_read" ON public.restaurants;
CREATE POLICY "restaurants_public_read" ON public.restaurants FOR SELECT TO authenticated, anon USING (true);

-- 7. RECARGAR CONFIGURACIÓN DE LA API
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ RECONSTRUCCIÓN COMPLETADA CON ÉXITO' as estado;
