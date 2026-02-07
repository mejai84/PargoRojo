-- =========================================================
-- DESHABILITAR RLS PARA DEBUGGING
-- Este es el problema: RLS está bloqueando PostgREST
-- =========================================================

BEGIN;

-- 1. DESHABILITAR RLS EN TODAS LAS TABLAS CRÍTICAS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- Deshabilitar en otras tablas si existen
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public') THEN
        ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items' AND table_schema = 'public') THEN
        ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tables' AND table_schema = 'public') THEN
        ALTER TABLE public.tables DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories' AND table_schema = 'public') THEN
        ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES (Para evitar conflictos)
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_owner_update" ON public.profiles;
DROP POLICY IF EXISTS "restaurants_public_read" ON public.restaurants;

-- 3. ASEGURAR PERMISOS COMPLETOS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 4. FORZAR RECARGA
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;

-- 5. VERIFICAR QUE RLS ESTÁ DESHABILITADO
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '🔒 Habilitado (MAL)'
        ELSE '✅ Deshabilitado (BIEN)'
    END as rls_estado
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'settings', 'restaurants', 'products')
ORDER BY tablename;

SELECT '🎉 RLS DESHABILITADO - Prueba el login AHORA' as resultado;
