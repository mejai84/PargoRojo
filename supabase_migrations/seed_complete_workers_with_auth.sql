-- Script completo para crear usuarios en auth.users y sus perfiles
-- Incluye el usuario administrador solicitado y trabajadores de prueba

-- Asegurar extensión para hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Función auxiliar para crear usuarios si no existen (idempotente)
CREATE OR REPLACE FUNCTION create_test_user(
    user_email TEXT, 
    user_password TEXT, 
    user_name TEXT, 
    user_role TEXT,
    user_phone TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
    new_uid UUID;
BEGIN
    -- 1. Verificar si el usuario ya existe en auth.users
    SELECT id INTO new_uid FROM auth.users WHERE email = user_email;

    -- Si no existe, crearlo
    IF new_uid IS NULL THEN
        new_uid := gen_random_uuid();
        
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
            new_uid,
            'authenticated',
            'authenticated',
            user_email,
            crypt(user_password, gen_salt('bf')),
            now(), -- Confirmado automáticamente
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('full_name', user_name),
            now(),
            now(),
            '',
            ''
        );
    ELSE
        -- Si existe, actualizamos password por si acaso (opcional)
        UPDATE auth.users 
        SET encrypted_password = crypt(user_password, gen_salt('bf'))
        WHERE id = new_uid;
    END IF;

    -- 2. Insertar o Actualizar Perfil en public.profiles
    INSERT INTO public.profiles (id, email, full_name, role, phone)
    VALUES (new_uid, user_email, user_name, user_role, user_phone)
    ON CONFLICT (id) DO UPDATE 
    SET 
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- EJECUCIÓN DE CREACIÓN DE USUARIOS
-- ==========================================

-- 1. Usuario Administrador (Solicitado)
SELECT create_test_user('jajl840316@gmail.com', '@Mejai840316', 'Administrador Principal', 'admin');

-- 2. Meseros
SELECT create_test_user('andres.mesero@pargorojo.com', '123456', 'Andrés Martínez', 'waiter', '3011234567');
SELECT create_test_user('luisa.mesera@pargorojo.com', '123456', 'Luisa Fernanda Torres', 'waiter', '3019876543');
SELECT create_test_user('mateo.mesero@pargorojo.com', '123456', 'Mateo Gómez', 'waiter', '3024567890');

-- 3. Cocina
SELECT create_test_user('elena.chef@pargorojo.com', '123456', 'Elena Rodríguez', 'cook', '3101112233');
SELECT create_test_user('mario.auxiliar@pargorojo.com', '123456', 'Mario Benítez', 'cook', '3104445566');

-- 4. Caja
SELECT create_test_user('ana.caja@pargorojo.com', '123456', 'Ana María López', 'cashier', '3207778899');

-- 5. Staff / Limpieza
SELECT create_test_user('julian.limpieza@pargorojo.com', '123456', 'Julián Castro', 'cleaner', '3005556677');
SELECT create_test_user('sofia.logistica@pargorojo.com', '123456', 'Sofía Vergara', 'staff', '3112223344');

-- 6. Admin Adicional
SELECT create_test_user('gerencia.comercial@pargorojo.com', '123456', 'Gerencia Comercial', 'admin', '3000000001');

-- Limpieza (Opcional): Borrar la función auxiliar si no se quiere conservar
-- DROP FUNCTION create_test_user;
