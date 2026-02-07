-- =========================================================
-- DIAGNÓSTICO: Empleado "cajera" no aparece en lista
-- Objetivo: Encontrar por qué el empleado no se ve
-- =========================================================

-- 1. Buscar en auth.users (debe existir si el sistema dijo que envió correo)
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data->>'full_name' as nombre
FROM auth.users 
WHERE 
    email ILIKE '%cajera%' 
    OR raw_user_meta_data->>'full_name' ILIKE '%cajera%'
ORDER BY created_at DESC;

-- 2. Buscar en public.profiles (aquí debería estar pero probablemente NO está)
SELECT 
    id,
    email,
    full_name,
    role,
    restaurant_id,
    created_at
FROM public.profiles 
WHERE 
    email ILIKE '%cajera%' 
    OR full_name ILIKE '%cajera%'
ORDER BY created_at DESC;

-- 3. Usuarios huérfanos (en auth pero NO en profiles)
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    u.raw_user_meta_data->>'full_name' as nombre,
    CASE 
        WHEN p.id IS NULL THEN '❌ SIN PERFIL EN PROFILES'
        ELSE '✅ Perfil existe'
    END as estado_perfil
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL  -- Solo los que NO tienen perfil
ORDER BY u.created_at DESC
LIMIT 10;

-- 4. Verificar último usuario creado en auth
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 5. Resultado consolidado
SELECT 
    '🔍 DIAGNÓSTICO COMPLETO' as seccion,
    (SELECT COUNT(*) FROM auth.users WHERE email ILIKE '%cajera%') as usuarios_en_auth,
    (SELECT COUNT(*) FROM public.profiles WHERE email ILIKE '%cajera%' OR full_name ILIKE '%cajera%') as perfiles_en_profiles,
    (SELECT COUNT(*) FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id WHERE p.id IS NULL) as usuarios_huerfanos_total;
