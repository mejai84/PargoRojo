-- =========================================================
-- DIAGNÓSTICO ESTRUCTURAL PROFUNDO
-- =========================================================

-- 1. VER ESTRUCTURA DE COLUMNAS (Buscando columnas generadas o raras)
SELECT 
    column_name, 
    data_type, 
    is_identity, 
    identity_generation,
    is_generated,
    generation_expression
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- 2. VERIFICAR SI HAY DULICIDAD DE IDENTIDAD EN AUTH.USERS
-- (A veces Ana existe dos veces con distinto ID y corrompe el login)
SELECT id, email, last_sign_in_at 
FROM auth.users 
WHERE email = 'ana.caja@pargorojo.com';

-- 3. VERIFICAR SI EXISTE EL PERFIL DE ANA
SELECT * 
FROM public.profiles 
WHERE email = 'ana.caja@pargorojo.com';

-- 4. VERIFICAR POLÍTICAS ACTUALES (Para confirmar que se borraron/crearon)
SELECT policyname, cmd, qual::text 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. VERIFICAR SI HAY VISTAS QUE DEPENDAN DE PROFILES
-- (Una vista rota puede bloquear la tabla)
SELECT table_name 
FROM information_schema.views 
WHERE view_definition ILIKE '%profiles%';

SELECT '✅ DIAGNÓSTICO EJECUTADO' as estado;
