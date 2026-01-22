-- Crea un usuario de demostración para el cliente
-- Credenciales:
-- Email: demo@pargorojo.com
-- Password: DemoUser2026!

BEGIN;

-- 1. Insertar en auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    'demo@pargorojo.com',
    crypt('DemoUser2026!', gen_salt('bf')), -- Contraseña encriptada
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Usuario Demo"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (email) DO NOTHING;

-- 2. Insertar o actualizar el perfil en public.profiles
-- Primero recuperamos el ID del usuario recién insertado (o el existente)
DO $$
DECLARE
    new_user_id uuid;
BEGIN
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'demo@pargorojo.com';

    IF new_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, full_name, role, email)
        VALUES (new_user_id, 'Usuario Demo', 'admin', 'demo@pargorojo.com')
        ON CONFLICT (id) DO UPDATE
        SET role = 'admin'; -- Asegurar que sea admin
    END IF;
END $$;

COMMIT;
