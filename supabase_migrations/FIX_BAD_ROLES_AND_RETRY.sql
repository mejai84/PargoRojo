    -- =========================================================
    -- CORRECCIÓN DE ROLES INVÁLIDOS Y REINTENTO DE CREACIÓN
    -- Objetivo: Normalizar roles existentes para aplicar la constraint
    -- =========================================================

    BEGIN;

    -- 1. NORMALIZAR ROLES EXISTENTES
    -- Si hay algún rol raro (ej: 'superadmin', 'user', ''), lo pasamos a 'customer'
    UPDATE public.profiles
    SET role = 'customer'
    WHERE role NOT IN ('admi', 'admin', 'manager', 'cashier', 'waiter', 'kitchen', 'customer');

    -- 2. AHORA SÍ: ACTUALIZAR CHECK CONSTRAINT
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('admi', 'admin', 'manager', 'cashier', 'waiter', 'kitchen', 'customer'));

    -- 3. CREAR LOS USUARIOS (Intento final)
    -- Limpiamos primero por si quedó algo a medias
    DELETE FROM public.profiles WHERE email IN ('clara.caja@pargorojo.com', 'marcos.mesero@pargorojo.com', 'carlos.chef@pargorojo.com', 'admin.demo@pargorojo.com');
    DELETE FROM auth.users WHERE email IN ('clara.caja@pargorojo.com', 'marcos.mesero@pargorojo.com', 'carlos.chef@pargorojo.com', 'admin.demo@pargorojo.com');

    DO $$
    DECLARE
        v_restaurant_id UUID;
        v_user_id UUID;
    BEGIN
        SELECT id INTO v_restaurant_id FROM public.restaurants WHERE subdomain = 'pargo-rojo' LIMIT 1;

        -- ADMIN DEMO
        v_user_id := gen_random_uuid();
        INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
        VALUES (v_user_id, 'authenticated', 'authenticated', 'admin.demo@pargorojo.com', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Admin Demo","role":"admin"}', now(), now());
        INSERT INTO public.profiles (id, email, full_name, role, restaurant_id) VALUES (v_user_id, 'admin.demo@pargorojo.com', 'Admin Demo', 'admin', v_restaurant_id);

        -- CLARA CAJERA
        v_user_id := gen_random_uuid();
        INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
        VALUES (v_user_id, 'authenticated', 'authenticated', 'clara.caja@pargorojo.com', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Clara Cajera","role":"cashier"}', now(), now());
        INSERT INTO public.profiles (id, email, full_name, role, restaurant_id) VALUES (v_user_id, 'clara.caja@pargorojo.com', 'Clara Cajera', 'cashier', v_restaurant_id);

        -- MARCOS MESERO
        v_user_id := gen_random_uuid();
        INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
        VALUES (v_user_id, 'authenticated', 'authenticated', 'marcos.mesero@pargorojo.com', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Marcos Mesero","role":"waiter"}', now(), now());
        INSERT INTO public.profiles (id, email, full_name, role, restaurant_id) VALUES (v_user_id, 'marcos.mesero@pargorojo.com', 'Marcos Mesero', 'waiter', v_restaurant_id);

        -- CARLOS CHEF
        v_user_id := gen_random_uuid();
        INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
        VALUES (v_user_id, 'authenticated', 'authenticated', 'carlos.chef@pargorojo.com', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Carlos Chef","role":"kitchen"}', now(), now());
        INSERT INTO public.profiles (id, email, full_name, role, restaurant_id) VALUES (v_user_id, 'carlos.chef@pargorojo.com', 'Carlos Chef', 'kitchen', v_restaurant_id);

    END $$;

    NOTIFY pgrst, 'reload config';

    COMMIT;

    SELECT '✅ ROLES CORREGIDOS Y USUARIOS CREADOS EXITOSAMENTE' as estado;
