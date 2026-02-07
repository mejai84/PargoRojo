-- =========================================================
-- REPARAR PERFIL FANTASMA (CLARA) - CORREGIDO
-- Objetivo: Crear el perfil público para clara.cajera@pargorojo.com
-- =========================================================

INSERT INTO public.profiles (id, email, full_name, role, restaurant_id, created_at, document_id)
SELECT 
    u.id, 
    u.email,
    'Clara Cajera',
    'cashier',
    (SELECT id FROM public.restaurants LIMIT 1),
    NOW(),
    '123456789' -- ID ficticio temporal
FROM auth.users u
WHERE u.email = 'clara.cajera@pargorojo.com'
AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Confirmar si se creó
SELECT * FROM public.profiles WHERE email = 'clara.cajera@pargorojo.com';
