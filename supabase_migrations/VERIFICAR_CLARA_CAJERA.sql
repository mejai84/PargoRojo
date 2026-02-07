-- =========================================================
-- VERIFICAR ESTADO DE CLARA
-- Objetivo: Confirmar que Clara existe y tiene rol cashier
-- =========================================================

-- 1. Verificar usuario en auth.users
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data->>'full_name' as nombre_metadata
FROM auth.users 
WHERE email = 'clara.caja@pargorojo.com';

-- 2. Verificar perfil en public.profiles
SELECT 
    id,
    email,
    full_name,
    role,
    restaurant_id,
    created_at,
    hire_date,
    document_id
FROM public.profiles 
WHERE email = 'clara.caja@pargorojo.com';

-- 3. Verificar turnos activos
SELECT 
    s.id,
    s.user_id,
    s.start_time,
    s.end_time,
    sd.name as turno_nombre
FROM public.shifts s
LEFT JOIN public.shift_definitions sd ON s.shift_definition_id = sd.id
WHERE s.user_id = (SELECT id FROM auth.users WHERE email = 'clara.caja@pargorojo.com')
ORDER BY s.start_time DESC
LIMIT 5;

-- 4. Verificar sesiones de caja abiertas
SELECT 
    cs.id,
    cs.user_id,
    cs.shift_id,
    cs.opening_amount,
    cs.opening_time,
    cs.closing_time,
    cs.status
FROM public.cashbox_sessions cs
WHERE cs.user_id = (SELECT id FROM auth.users WHERE email = 'clara.caja@pargorojo.com')
ORDER BY cs.opening_time DESC
LIMIT 5;

-- 5. Resultado consolidado
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'clara.caja@pargorojo.com')
        THEN '❌ Clara NO existe en auth.users'
        WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'clara.caja@pargorojo.com')
        THEN '❌ Clara NO tiene perfil en profiles'
        WHEN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE email = 'clara.caja@pargorojo.com' AND role = 'cashier'
        )
        THEN '✅ Clara existe y tiene rol de CASHIER correctamente'
        ELSE '⚠️ Clara existe pero su rol NO es cashier'
    END as estado_clara;
