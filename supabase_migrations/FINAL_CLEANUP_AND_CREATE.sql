-- =========================================================
-- LIMPIEZA FINAL Y CREACIÓN DEL EQUIPO NUEVO
-- Objetivo: Borrar TOOOODOS los usuarios de prueba viejos y dejar solo el nuevo equipo y tu admin.
-- =========================================================

BEGIN;

-- 1. DESVINCULAR ÓRDENES (FOREIGN KEYS) DE TODOS LOS USUARIOS EXCEPTO TÚ
-- Esto evita el error "update or delete on table profiles violates foreign key..."
UPDATE public.orders
SET waiter_id = NULL
WHERE waiter_id IN (
    SELECT id FROM public.profiles 
    WHERE email NOT LIKE '%jajl840316@gmail.com%'
);

-- 2. ELIMINAR TURNOS DE TODOS LOS USUARIOS EXCEPTO TÚ
-- Verificamos si existe la columna 'user_id' o 'employee_id' y borramos
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'user_id') THEN
        EXECUTE 'DELETE FROM public.shifts WHERE user_id IN (SELECT id FROM public.profiles WHERE email NOT LIKE ''%jajl840316@gmail.com%'')';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'employee_id') THEN
        EXECUTE 'DELETE FROM public.shifts WHERE employee_id IN (SELECT id FROM public.profiles WHERE email NOT LIKE ''%jajl840316@gmail.com%'')';
    END IF;
END $$;

-- 3. BORRAR TODOS LOS PERFILES Y USUARIOS (EXCEPTO TÚ)
DELETE FROM public.profiles WHERE email NOT LIKE '%jajl840316@gmail.com%';
DELETE FROM auth.users WHERE email NOT LIKE '%jajl840316@gmail.com%';

-- 4. ARREGLAR CONSTRAINT DE ROLES (Permitir 'kitchen')
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admi', 'admin', 'manager', 'cashier', 'waiter', 'kitchen', 'customer'));

-- 5. CREAR EQUIPO NUEVO (Clara, Marcos, Carlos, Admin Demo)
DO $$
DECLARE
    v_restaurant_id UUID;
    v_user_id UUID;
BEGIN
    -- Asegurar restaurante
    INSERT INTO public.restaurants (name, subdomain, primary_color) VALUES ('Pargo Rojo', 'pargo-rojo', '#ef4444') ON CONFLICT (subdomain) DO NOTHING;
    SELECT id INTO v_restaurant_id FROM public.restaurants WHERE subdomain = 'pargo-rojo' LIMIT 1;

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

    -- ADMIN DEMO
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (v_user_id, 'authenticated', 'authenticated', 'admin.demo@pargorojo.com', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Admin Demo","role":"admin"}', now(), now());
    INSERT INTO public.profiles (id, email, full_name, role, restaurant_id) VALUES (v_user_id, 'admin.demo@pargorojo.com', 'Admin Demo', 'admin', v_restaurant_id);

END $$;

-- 6. RECARGAR
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ BASE DE DATOS LIMPIA Y NUEVO EQUIPO CREADO' as estado;
