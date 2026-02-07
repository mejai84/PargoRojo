-- =========================================================
-- REPARAR PERFIL FANTASMA (CLARA)
-- Objetivo: Crear el perfil público para clara.cajera@pargorojo.com
-- =========================================================

INSERT INTO public.profiles (id, email, full_name, role, restaurant_id, created_at, document_id)
SELECT 
    id, 
    email,
    'Clara Cajera', -- Nombre
    'cashier', -- Rol (Cajero)
    (SELECT id FROM public.restaurants LIMIT 1), -- Restaurante
    NOW(),
    '123456789' -- ID ficticio temporal
FROM auth.users
WHERE email = 'clara.cajera@pargorojo.com'
AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE profile.id = users.id);

-- Confirmar si se creó
SELECT * FROM public.profiles WHERE email = 'clara.cajera@pargorojo.com';
