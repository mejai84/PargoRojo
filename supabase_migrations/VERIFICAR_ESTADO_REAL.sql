-- =========================================================
-- VERIFICACIÓN CRÍTICA: ¿Está PostgREST realmente funcionando?
-- =========================================================

-- 1. Verificar que las tablas existen
SELECT 
    'Tabla: ' || tablename as verificacion,
    CASE 
        WHEN tablename IS NOT NULL THEN '✅ Existe'
        ELSE '❌ No existe'
    END as estado
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'settings', 'restaurants', 'products')
ORDER BY tablename;

-- 2. Verificar que authenticator puede hacer SELECT
SET ROLE authenticator;
SELECT 'authenticator puede hacer SELECT en profiles' as test;
SELECT COUNT(*) as total_profiles FROM public.profiles;
RESET ROLE;

-- 3. Verificar que anon puede hacer SELECT
SET ROLE anon;
SELECT 'anon puede hacer SELECT en profiles' as test;
SELECT COUNT(*) as total_profiles FROM public.profiles;
RESET ROLE;

-- 4. Verificar usuarios en auth.users
SELECT 
    email,
    role,
    confirmed_at IS NOT NULL as email_confirmado,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar que existe el usuario de prueba
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'clara.caja@pargorojo.com') 
        THEN '✅ Usuario clara.caja@pargorojo.com existe'
        ELSE '❌ Usuario NO existe - Necesitas crearlo'
    END as verificacion_usuario;

-- 6. Verificar el perfil del usuario
SELECT 
    p.email,
    p.full_name,
    p.role,
    p.restaurant_id
FROM public.profiles p
WHERE p.email = 'clara.caja@pargorojo.com';

SELECT '✅ VERIFICACIÓN COMPLETADA - Revisa los resultados' as estado;
