-- =========================================================
-- CREACIÓN DE USUARIOS FRESCOS (EQUIPO B)
-- Objetivo: Eliminar usuarios viejos rotos y crear nuevos limpios
-- =========================================================

BEGIN;

-- 1. LIMPIAR REFERENCIAS DE LOS USUARIOS VIEJOS (Ana, Andres, Elena, Demo)
-- Desvincular órdenes
UPDATE public.orders
SET waiter_id = NULL
WHERE waiter_id IN (SELECT id FROM public.profiles WHERE email IN ('ana.caja@pargorojo.com', 'andres.mesero@pargorojo.com', 'elena.chef@pargorojo.com', 'demo@pargorojo.com'));

-- 2. ELIMINAR LOS USUARIOS VIEJOS (Si existen)
DELETE FROM public.profiles WHERE email IN ('ana.caja@pargorojo.com', 'andres.mesero@pargorojo.com', 'elena.chef@pargorojo.com', 'demo@pargorojo.com');
DELETE FROM auth.users WHERE email IN ('ana.caja@pargorojo.com', 'andres.mesero@pargorojo.com', 'elena.chef@pargorojo.com', 'demo@pargorojo.com');

-- 3. CREAR LOS NUEVOS USUARIOS FRESCOS
DO $$
DECLARE
    v_restaurant_id UUID;
    v_user_id UUID;
BEGIN
    SELECT id INTO v_restaurant_id FROM public.restaurants WHERE subdomain = 'pargo-rojo' LIMIT 1;

    -- 1. ADMIN DEMO (admin.demo@pargorojo.com)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (v_user_id, 'authenticated', 'authenticated', 'admin.demo@pargorojo.com', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Admin Demo","role":"admin"}', now(), now());
    INSERT INTO public.profiles (id, email, full_name, role, restaurant_id) VALUES (v_user_id, 'admin.demo@pargorojo.com', 'Admin Demo', 'admin', v_restaurant_id);

    -- 2. CLARA CAJERA (clara.caja@pargorojo.com)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (v_user_id, 'authenticated', 'authenticated', 'clara.caja@pargorojo.com', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Clara Cajera","role":"cashier"}', now(), now());
    INSERT INTO public.profiles (id, email, full_name, role, restaurant_id) VALUES (v_user_id, 'clara.caja@pargorojo.com', 'Clara Cajera', 'cashier', v_restaurant_id);

    -- 3. MARCOS MESERO (marcos.mesero@pargorojo.com)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (v_user_id, 'authenticated', 'authenticated', 'marcos.mesero@pargorojo.com', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Marcos Mesero","role":"waiter"}', now(), now());
    INSERT INTO public.profiles (id, email, full_name, role, restaurant_id) VALUES (v_user_id, 'marcos.mesero@pargorojo.com', 'Marcos Mesero', 'waiter', v_restaurant_id);

     -- 4. CARLOS CHEF (carlos.chef@pargorojo.com)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (v_user_id, 'authenticated', 'authenticated', 'carlos.chef@pargorojo.com', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Carlos Chef","role":"kitchen"}', now(), now());
    INSERT INTO public.profiles (id, email, full_name, role, restaurant_id) VALUES (v_user_id, 'carlos.chef@pargorojo.com', 'Carlos Chef', 'kitchen', v_restaurant_id);

END $$;

-- 4. RECARGAR
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ USUARIOS NUEVOS CREADOS: Clara, Marcos, Carlos y Admin Demo' as estado;
