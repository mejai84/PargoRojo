-- =========================================================
-- DIAGNÓSTICO: Empleados creados con rol 'customer'
-- Objetivo: Encontrar por qué los roles se sobrescriben
-- =========================================================

-- 1. Ver TODOS los perfiles recientes (incluyendo customers)
SELECT 
    id,
    email,
    full_name,
    role,
    restaurant_id,
    created_at,
    CASE 
        WHEN role = 'customer' THEN '⚠️ CLIENTE (puede ser empleado mal creado)'
        ELSE '✅ ' || UPPER(role)
    END as estado
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 2. Buscar triggers activos en la tabla profiles
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- 3. Buscar funciones que se ejecutan en triggers
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname ILIKE '%profile%'
   OR p.proname ILIKE '%user%'
   OR p.proname ILIKE '%handle%'
ORDER BY p.proname;

-- 4. Verificar políticas RLS en profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 5. Script de REPARACIÓN - Convertir customers recientes a su rol correcto
-- NOTA: Este script debe ejecutarse DESPUÉS de confirmar el diagnóstico

-- Primero, mostrar los candidates a reparar:
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role as rol_actual,
    u.raw_user_meta_data->>'full_name' as nombre_en_auth,
    p.created_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'customer'
  AND p.created_at > NOW() - INTERVAL '1 hour'  -- Creados en la última hora
  AND p.email ILIKE '%pargorojo.com'  -- Emails internos
ORDER BY p.created_at DESC;

-- COMENTARIO: No ejecutar UPDATE todavía, primero confirmar con el diagnóstico
