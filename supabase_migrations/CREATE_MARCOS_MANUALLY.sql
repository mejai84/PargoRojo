-- =========================================================
-- CREACIÓN MANUAL DE MARCOS (BYPASS EMAIL LIMIT)
-- Objetivo: Crear usuario y perfil sin disparar correos
-- =========================================================

BEGIN;

-- 1. Variables
DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
    rest_id uuid;
BEGIN
    -- Obtener ID del restaurante
    SELECT id INTO rest_id FROM public.restaurants LIMIT 1;

    -- 2. Crear Usuario en Auth (Confirmado automáticamente)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
        created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated', 'authenticated', 
        'marcos.mesero@pargorojo.com', -- EMAIL
        crypt('password123', gen_salt('bf')), -- CONTRASEÑA
        NOW(), -- Confirmado YA
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Marcos Mesero"}',
        NOW(), NOW()
    );

    -- 3. Crear Perfil Público
    INSERT INTO public.profiles (
        id, email, full_name, role, restaurant_id, created_at, document_id, hire_date
    ) VALUES (
        new_user_id,
        'marcos.mesero@pargorojo.com',
        'Marcos Mesero',
        'waiter', -- ROL DE MESERO
        rest_id,
        NOW(),
        '987654321', -- Documento temporal
        CURRENT_DATE
    );

END $$;

COMMIT;

SELECT '✅ MARCOS CREADO. Puede entrar con password123.' as estado;
