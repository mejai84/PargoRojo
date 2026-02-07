-- =========================================================
-- ARREGLO DE ROLES Y CREACIÓN DE USUARIOS
-- Objetivo: Permitir rol 'kitchen' y crear usuarios frescos
-- =========================================================

BEGIN;

-- 1. ACTUALIZAR CHECK CONSTRAINT DE ROLES
-- Primero eliminamos la restricción actual
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Luego la volvemos a crear con 'kitchen' incluido
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admi', 'admin', 'manager', 'cashier', 'waiter', 'kitchen', 'customer'));
-- Nota: 'admi' estaba por error histórico, lo mantenemos por si acaso

-- 2. DENTRO DE LA TRANSACCIÓN, CREAR LOS USUARIOS
-- (Como falló antes, empezamos de nuevo la lógica de creación)

-- Limpiar intento fallido previo
DELETE FROM public.profiles WHERE email IN ('clara.caja@pargorojo.com', 'marcos.mesero@pargorojo.com', 'carlos.chef@pargorojo.com', 'admin.demo@pargorojo.com');
DELETE FROM auth.users WHERE email IN ('clara.caja@pargorojo.com', 'marcos.mesero@pargorojo.com', 'carlos.chef@pargorojo.com', 'admin.demo@pargorojo.com');

DO $$
DECLARE
    v_restaurant_id UUID;
    v_user_id UUID;
BEGIN
    SELECT id INTO v_restaurant_id FROM public.restaurants WHERE subdomain = 'pargo-rojo' LIMIT 1;

    -- 1. ADMIN DEMO
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (v_user_id, 'authenticated', 'authenticated', 'admin.demo@pargorojo.com', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Admin Demo","role":"admin"}', now(), now());
    INSERT INTO public.profiles (id, email, full_name, role, restaurant_id) VALUES (v_user_id, 'admin.demo@pargorojo.com', 'Admin Demo', 'admin', v_restaurant_id);

    -- 2. CLARA CAJERA
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (v_user_id, 'authenticated', 'authenticated', 'clara.caja@pargorojo.com', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Clara Cajera","role":"cashier"}', now(), now());
    INSERT INTO public.profiles (id, email, full_name, role, restaurant_id) VALUES (v_user_id, 'clara.caja@pargorojo.com', 'Clara Cajera', 'cashier', v_restaurant_id);

    -- 3. MARCOS MESERO
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (v_user_id, 'authenticated', 'authenticated', 'marcos.mesero@pargorojo.com', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Marcos Mesero","role":"waiter"}', now(), now());
    INSERT INTO public.profiles (id, email, full_name, role, restaurant_id) VALUES (v_user_id, 'marcos.mesero@pargorojo.com', 'Marcos Mesero', 'waiter', v_restaurant_id);

     -- 4. CARLOS CHEF (Ahora sí funcionará 'kitchen')
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (v_user_id, 'authenticated', 'authenticated', 'carlos.chef@pargorojo.com', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Carlos Chef","role":"kitchen"}', now(), now());
    INSERT INTO public.profiles (id, email, full_name, role, restaurant_id) VALUES (v_user_id, 'carlos.chef@pargorojo.com', 'Carlos Chef', 'kitchen', v_restaurant_id);

END $$;

-- 3. RECARGAR
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ ROLES ACTUALIZADOS Y USUARIOS CREADOS' as estado;
