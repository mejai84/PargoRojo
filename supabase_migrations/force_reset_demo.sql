-- Resetear contraseña de usuario demo y asegurar esquema

-- 1. Asegurar extensión crypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Recargar caché de esquema (para solucionar error 'querying schema')
NOTIFY pgrst, 'reload schema';

-- 3. Actualizar contraseña del usuario demo
UPDATE auth.users
SET encrypted_password = crypt('DemoUser2026!', gen_salt('bf'))
WHERE email = 'demo@pargorojo.com';

-- 4. Verificar si el usuario existe, si no, crearlo de nuevo (backup)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'demo@pargorojo.com') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 
            gen_random_uuid(), 
            'authenticated', 
            'authenticated', 
            'demo@pargorojo.com', 
            crypt('DemoUser2026!', gen_salt('bf')), 
            now(), 
            '{"provider":"email","providers":["email"]}', 
            '{"full_name":"Usuario Demo"}', 
            now(), 
            now()
        );
    END IF;
END $$;

-- 5. Asegurar perfil
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, 'Usuario Demo', 'admin'
FROM auth.users WHERE email = 'demo@pargorojo.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
