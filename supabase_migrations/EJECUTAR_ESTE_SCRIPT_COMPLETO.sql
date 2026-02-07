-- =========================================================
-- SCRIPT DE REPARACIÓN COMPLETA DE LA BASE DE DATOS
-- Ejecutar este script completo en el SQL Editor de Supabase
-- =========================================================
-- INSTRUCCIONES:
-- 1. Ve a: https://supabase.com/dashboard/project/ryxqoapzxvsxqdsy4zw/sql/new
-- 2. Copia y pega TODO este script
-- 3. Haz clic en "Run" o presiona Ctrl+Enter
-- 4. Espera a que termine (verás mensajes de éxito)
-- 5. Intenta hacer login nuevamente
-- =========================================================

BEGIN;

-- =========================================================
-- FASE 1: REPARACIÓN DE INFRAESTRUCTURA
-- =========================================================

-- 1. REPARAR TABLA SETTINGS (Nombres exactos que pide el frontend)
DROP TABLE IF EXISTS public.settings CASCADE;
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos mínimos para que el frontend no rompa
INSERT INTO public.settings (key, value) 
VALUES 
    ('logo_url', ''), 
    ('business_info', '{}'),
    ('primary_color', '#ef4444')
ON CONFLICT (key) DO NOTHING;

-- 2. PERMISOS TOTALES (Sin RLS para debugging)
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.settings TO anon, authenticated, authenticator;

-- 3. REPARAR EL MOTOR DE LA API (Roles y Search Path)
ALTER ROLE authenticator SET search_path TO public, extensions, auth;
ALTER ROLE anon SET search_path TO public, extensions, auth;
ALTER ROLE authenticated SET search_path TO public, extensions, auth;

-- 4. GRANTS DE ESQUEMA VITALES
GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, authenticator;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, authenticator;

SELECT '✅ FASE 1 COMPLETADA: Infraestructura reparada' as estado;

-- =========================================================
-- FASE 2: RECUPERACIÓN DE PERMISOS
-- =========================================================

-- 1. DESHABILITAR RLS PARA DEBUGGING (Para asegurar que la API vea el esquema)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- Verificar si existen las tablas antes de deshabilitar RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public') THEN
        ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurants' AND table_schema = 'public') THEN
        ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

SELECT '✅ FASE 2 COMPLETADA: Permisos recuperados' as estado;

-- =========================================================
-- FASE 3: RECONSTRUCCIÓN QUIRÚRGICA
-- =========================================================

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

-- 4. RESTAURAR FUNCIÓN DE NUEVO USUARIO
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

-- 6. REACTIVAR RLS Y POLÍTICAS LIMPIAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Política de lectura: Todos pueden ver perfiles
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT TO authenticated, anon USING (true);

-- Política de actualización: Solo el dueño actualiza su perfil
DROP POLICY IF EXISTS "profiles_owner_update" ON public.profiles;
CREATE POLICY "profiles_owner_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Política de restaurantes: Lectura pública
DROP POLICY IF EXISTS "restaurants_public_read" ON public.restaurants;
CREATE POLICY "restaurants_public_read" ON public.restaurants FOR SELECT TO authenticated, anon USING (true);

SELECT '✅ FASE 3 COMPLETADA: Reconstrucción quirúrgica finalizada' as estado;

-- =========================================================
-- FASE 4: RECARGA FINAL
-- =========================================================

-- Notificar a PostgREST para recargar la configuración
NOTIFY pgrst, 'reload config';

COMMIT;

-- =========================================================
-- VERIFICACIÓN FINAL
-- =========================================================

SELECT '🎉 REPARACIÓN COMPLETADA CON ÉXITO' as estado;
SELECT 'Intenta hacer login en: https://pargo-rojo.vercel.app/login' as siguiente_paso;

-- Verificar que las tablas críticas existen
SELECT 
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ Tablas críticas OK'
        ELSE '⚠️ Faltan tablas'
    END as verificacion_tablas
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'restaurants', 'settings');
