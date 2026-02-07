-- =========================================================
-- LIMPIEZA INTELIGENTE DE USUARIOS (V2)
-- Objetivo: Borrar usuarios de prueba SIN romper el historial de reportes
-- =========================================================

BEGIN;

-- 1. DESVINCULAR ÓRDENES DE LOS USUARIOS QUE VAMOS A BORRAR
-- (Mantenemos la venta para los reportes, pero quitamos la referencia al mesero "viejo")
UPDATE public.orders
SET waiter_id = NULL
WHERE waiter_id IN (
    SELECT id FROM public.profiles 
    WHERE email NOT LIKE '%jajl840316@gmail.com%'
);

-- Si existe cashier_id en orders, también lo limpiamos
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'cashier_id') THEN
        EXECUTE 'UPDATE public.orders SET cashier_id = NULL WHERE cashier_id IN (SELECT id FROM public.profiles WHERE email NOT LIKE ''%jajl840316@gmail.com%'')';
    END IF;
END $$;

-- 2. ELIMINAR TURNOS (SHIFTS) DE LOS USUARIOS A BORRAR
-- (Los turnos viejos de prueba no son necesarios para reportes de venta)
DELETE FROM public.shifts
WHERE employee_id IN ( -- Asumiendo employee_id o user_id, intentamos ambos
    SELECT id FROM public.profiles 
    WHERE email NOT LIKE '%jajl840316@gmail.com%'
);

-- Intentar con user_id si existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'user_id') THEN
        EXECUTE 'DELETE FROM public.shifts WHERE user_id IN (SELECT id FROM public.profiles WHERE email NOT LIKE ''%jajl840316@gmail.com%'')';
    END IF;
END $$;


-- 3. AHORA SÍ: ELIMINAR PERFILES Y USUARIOS (EXCEPTO TÚ)
DELETE FROM public.profiles 
WHERE email NOT LIKE '%jajl840316@gmail.com%';

DELETE FROM auth.users 
WHERE email NOT LIKE '%jajl840316@gmail.com%';


-- 4. RECREAR LOS USUARIOS NUEVOS ("Limpios")
-- Obtenemos ID del Restaurante Pargo Rojo
DO $$
DECLARE
    v_restaurant_id UUID;
    v_user_id UUID;
BEGIN
    SELECT id INTO v_restaurant_id FROM public.restaurants WHERE subdomain = 'pargo-rojo' LIMIT 1;

    -- Función helper interna para no ensuciar esquema
    -- (Crear Demo Admin)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'demo@pargorojo.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Admin","role":"admin"}', now(), now());
    INSERT INTO public.profiles (id, email, full_name, role, restaurant_id) VALUES (v_user_id, 'demo@pargorojo.com', 'Demo Admin', 'admin', v_restaurant_id);

    -- (Crear Ana Caja)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'ana.caja@pargorojo.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ana Caja","role":"cashier"}', now(), now());
    INSERT INTO public.profiles (id, email, full_name, role, restaurant_id) VALUES (v_user_id, 'ana.caja@pargorojo.com', 'Ana Caja', 'cashier', v_restaurant_id);

    -- (Crear Andrés Mesero)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'andres.mesero@pargorojo.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Andrés Mesero","role":"waiter"}', now(), now());
    INSERT INTO public.profiles (id, email, full_name, role, restaurant_id) VALUES (v_user_id, 'andres.mesero@pargorojo.com', 'Andrés Mesero', 'waiter', v_restaurant_id);

     -- (Crear Elena Chef)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'elena.chef@pargorojo.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Elena Chef","role":"kitchen"}', now(), now());
    INSERT INTO public.profiles (id, email, full_name, role, restaurant_id) VALUES (v_user_id, 'elena.chef@pargorojo.com', 'Elena Chef', 'kitchen', v_restaurant_id);

END $$;

-- 5. RECARGAR
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ USUARIOS REGENERADOS SIN ROMPER FOREIGN KEYS' as estado;
