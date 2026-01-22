-- Execute this in Supabase SQL Editor to create the Demo Admin User

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    new_uid UUID;
BEGIN
    -- 1. Check if user exists
    SELECT id INTO new_uid FROM auth.users WHERE email = 'demo@pargorojo.com';

    -- 2. Create user if not exists
    IF new_uid IS NULL THEN
        new_uid := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 
            new_uid, 
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
    ELSE
        -- Update password if exists
        UPDATE auth.users 
        SET encrypted_password = crypt('DemoUser2026!', gen_salt('bf'))
        WHERE id = new_uid;
    END IF;

    -- 3. Create or Update Profile
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (new_uid, 'demo@pargorojo.com', 'Usuario Demo', 'admin')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'admin', full_name = 'Usuario Demo';
    
END $$;
