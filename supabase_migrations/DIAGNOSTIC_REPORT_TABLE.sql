-- =========================================================
-- REPORTE DE DIAGNÓSTICO UNIFICADO
-- Devuelve una tabla con el estado de cada componente crítico
-- =========================================================

WITH checks AS (
    -- 1. VERIFICAR DUPLICADOS EN AUTH (Ana Caja)
    SELECT 
        '1. Usuario Auth (Ana)' as chequeo,
        CASE 
            WHEN count(*) = 0 THEN '❌ NO EXISTE (Debe registrarse de nuevo)'
            WHEN count(*) = 1 THEN '✅ OK (Un solo usuario)'
            ELSE '❌ ERROR CRÍTICO: DUPLICADOS DETECTADOS (' || count(*) || ')'
        END as resultado,
        (SELECT 'ID: ' || id FROM auth.users WHERE email = 'ana.caja@pargorojo.com' LIMIT 1) as detalles
    FROM auth.users 
    WHERE email = 'ana.caja@pargorojo.com'

    UNION ALL

    -- 2. VERIFICAR PERFIL EN PUBLIC (Ana Caja)
    SELECT 
        '2. Perfil Público (Ana)',
        CASE 
            WHEN count(*) = 0 THEN '❌ NO EXISTE PERFIL (Falta Insert)'
            WHEN count(*) = 1 THEN '✅ OK (Perfil existe)'
            ELSE '❌ ERROR: Múltiples perfiles'
        END,
        (SELECT 'Role: ' || role FROM public.profiles WHERE email = 'ana.caja@pargorojo.com' LIMIT 1)
    FROM public.profiles 
    WHERE email = 'ana.caja@pargorojo.com'

    UNION ALL

    -- 3. VERIFICAR COLUMNA 'restaurant_id' (Causa común de error en Provider)
    SELECT 
        '3. Columna profiles.restaurant_id',
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'restaurant_id') 
            THEN '✅ OK (Existe)'
            ELSE '❌ FALTA COLUMNA (Causa error en Frontend)'
        END,
        'Necesaria para RestaurantProvider'

    UNION ALL

    -- 4. VERIFICAR COLUMNA 'user_id' EN SHIFTS
    SELECT 
        '4. Columna shifts.user_id',
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'user_id') 
            THEN '✅ OK (Existe)'
            ELSE '⚠️ NO EXISTE (Verificar nombre columna)'
        END,
        'Usada en políticas de seguridad'
)
SELECT * FROM checks ORDER BY chequeo;
