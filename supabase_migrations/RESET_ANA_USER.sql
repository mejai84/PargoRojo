-- =========================================================
-- RESET DE USUARIO ANA (Solución "Borrón y Cuenta Nueva")
-- =========================================================

BEGIN;

-- 1. ELIMINAR RASTROS DE ANA (Para evitar conflictos)
DELETE FROM public.profiles WHERE email = 'ana.caja@pargorojo.com';
DELETE FROM auth.users WHERE email = 'ana.caja@pargorojo.com';

-- 2. RE-CREAR EL USUARIO ANA EN AUTH.USERS
-- Insertamos manualmente simulando un registro exitoso
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated', -- Rol de Supabase auth (NO CAMBIAR)
    'ana.caja@pargorojo.com',
    crypt('password123', gen_salt('bf')), -- Contraseña: password123
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Ana Caja","role":"cashier"}', -- Aquí definimos que es cajera
    now(),
    now(),
    '',
    ''
);

-- 3. INSERTAR SU PERFIL PÚBLICO (Ya con el fix de restaurant_id)
INSERT INTO public.profiles (id, email, full_name, role, restaurant_id)
SELECT 
    id, 
    email, 
    'Ana Caja', 
    'cashier',
    (SELECT id FROM public.restaurants WHERE subdomain = 'pargo-rojo' LIMIT 1)
FROM auth.users 
WHERE email = 'ana.caja@pargorojo.com';

-- 4. CONFIRMAR QUE TODO QUEDÓ BIEN
SELECT email, role, id FROM public.profiles WHERE email = 'ana.caja@pargorojo.com';

COMMIT;

SELECT '✅ USUARIO ANA RE-CREADO EXITOSAMENTE. Password: password123' as resultado;
