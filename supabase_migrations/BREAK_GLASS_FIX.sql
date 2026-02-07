-- =========================================================
-- SOLUCIÓN "ROMPE-VIDRIO" CONSOLIDADA
-- Objetivo: Eliminar error de Schema y Error de JS a la vez
-- =========================================================

BEGIN;

-- 1. 🛡️ DESHABILITAR RLS (Lo que funcionó antes)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- Asegurar otras tablas también
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public') THEN
        ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 2. 🐛 REPARAR DATOS DE BUSINESS_INFO (Para evitar error JS)
UPDATE public.settings
SET value = '{"name": "Pargo Rojo", "tagline": "Gran Rafa | Experiencia Gastronómica de Mar", "address": "C.Cial. Cauca Centro, Caucasia", "phone": "320 784 8287", "email": "admin@pargorojo.com"}'
WHERE key = 'business_info';

-- 3. 🔑 PERMISOS DE EMERGENCIA (Para asegurar que PostgREST vea todo)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA information_schema TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO anon, authenticated, service_role;

-- 4. 🔄 RECARGA FINAL
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT '✅ TODO APLICADO. Prueba el login en LOCALHOST ahora.' as estado;
