-- =========================================================
-- REGENERACIÓN QUIRÚRGICA DE USUARIO ADMIN
-- Objetivo: Eliminar cualquier corrupción en auth.users y profiles
-- =========================================================

BEGIN;

-- 1. Eliminar usuario existente (LIMPIEZA TOTAL)
DELETE FROM auth.users WHERE email = 'admin.demo@pargorojo.com';
DELETE FROM public.profiles WHERE email = 'admin.demo@pargorojo.com'; -- Por si acaso quedó huérfano

-- 2. Crear nuevo usuario en auth.users (ID manual para evitar problemas)
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
    'd8616ce5-7651-44ea-814a-96f09e32e8be', -- Mismo ID que antes para mantener consistencia
    'authenticated',
    'authenticated', -- ROL DE SUPABASE (NO DE LA APP)
    'admin.demo@pargorojo.com',
    crypt('password123', gen_salt('bf')), -- Contraseña: password123
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Admin Demo", "role": "admin"}', -- Metadata importante
    NOW(),
    NOW(),
    '',
    ''
);

-- 3. Crear perfil en public.profiles (MANUALMENTE para evitar triggers fallidos)
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    restaurant_id,
    created_at,
    updated_at
) VALUES (
    'd8616ce5-7651-44ea-814a-96f09e32e8be',
    'admin.demo@pargorojo.com',
    'Admin Demo',
    'admin',
    (SELECT id FROM public.restaurants LIMIT 1), -- Asignar al primer restaurante
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE 
SET role = 'admin', 
    restaurant_id = (SELECT id FROM public.restaurants LIMIT 1);

-- 4. Asegurar permisos otra vez (nunca está de más)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated; -- A veces necesario para ver el propio usuario

COMMIT;

SELECT '✅ USUARIO ADMIN REGENERADO. Prueba login con: admin.demo@pargorojo.com / password123' as estado;
