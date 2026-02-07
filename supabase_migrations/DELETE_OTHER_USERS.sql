-- =========================================================
-- LIMPIEZA DE USUARIOS (EXCEPTO ADMIN PRINCIPAL)
-- Objetivo: Borrar todos los usuarios de prueba, dejando solo al dueño
-- =========================================================

BEGIN;

-- 1. Borrar perfiles públicos (excepto el tuyo)
DELETE FROM public.profiles 
WHERE email NOT IN ('jajl840316@gmail.com');

-- 2. Borrar usuarios de autenticación (excepto el tuyo)
DELETE FROM auth.users 
WHERE email NOT IN ('jajl840316@gmail.com');

COMMIT;

SELECT '✅ LIMPIEZA COMPLETADA. Solo queda el usuario jajl840316@gmail.com' as estado;
