-- =========================================================
-- LIMPIEZA TOTAL Y REGENERACIÓN DE USUARIOS
-- Objetivo: Borrar todo excepto 'jajl840316@gmail.com' y regenerar demos
-- =========================================================

BEGIN;

-- 1. LIMPIEZA DE USUARIOS DE PRUEBA (EXCEPTO TU ADMIN)
-- Borramos de profiles primero para evitar FK errors
DELETE FROM public.profiles 
WHERE email NOT LIKE '%jajl840316@gmail.com%';

-- Borramos de auth.users (Cascada)
DELETE FROM auth.users 
WHERE email NOT LIKE '%jajl840316@gmail.com%';

-- 2. RECUPERAR EL ID DEL RESTAURANTE 'Pargo Rojo'
-- (Usamos una variable temporal o subquery)
-- Aseguramos que el restaurante exista primero
INSERT INTO public.restaurants (name, subdomain, primary_color)
VALUES ('Pargo Rojo', 'pargo-rojo', '#ef4444')
ON CONFLICT (subdomain) DO NOTHING;

-- 3. FUNCIÓN AUXILIAR PARA CREAR USUARIOS DE FORMA LIMPIA
-- Esta función crea el usuario en auth y su perfil en public
CREATE OR REPLACE FUNCTION create_demo_user(
    p_email TEXT, 
    p_name TEXT, 
    p_role TEXT, 
    p_password TEXT
) RETURNS VOID AS $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_restaurant_id UUID;
BEGIN
    -- Obtener ID del restaurante
    SELECT id INTO v_restaurant_id FROM public.restaurants WHERE subdomain = 'pargo-rojo' LIMIT 1;
    
    -- Insertar en Auth
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
        created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        p_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        json_build_object('full_name', p_name, 'role', p_role),
        now(),
        now(),
        '',
        ''
    );

    -- Insertar en Profiles (Explícito)
    INSERT INTO public.profiles (id, email, full_name, role, restaurant_id)
    VALUES (v_user_id, p_email, p_name, p_role, v_restaurant_id);

    -- Si es staff, asegurarnos de que no tenga problemas de RLS asignándole permisos básicos
    -- (Esto ya lo maneja RLS, pero por si acaso)
END;
$$ LANGUAGE plpgsql;

-- 4. GENERAR LOS USUARIOS NUEVOS
SELECT create_demo_user('demo@pargorojo.com', 'Demo Admin', 'admin', 'password123');
SELECT create_demo_user('ana.caja@pargorojo.com', 'Ana Caja', 'cashier', 'password123');
SELECT create_demo_user('andres.mesero@pargorojo.com', 'Andrés Mesero', 'waiter', 'password123');
SELECT create_demo_user('elena.chef@pargorojo.com', 'Elena Chef', 'kitchen', 'password123');

-- 5. LIMPIEZA DE LA FUNCIÓN AUXILIAR
DROP FUNCTION create_demo_user;

-- 6. FORZAR TU PERFIL (jajl84) A TENER EL RESTAURANT_ID CORRECTO TAMBIÉN
UPDATE public.profiles
SET restaurant_id = (SELECT id FROM public.restaurants WHERE subdomain = 'pargo-rojo' LIMIT 1)
WHERE email LIKE '%jajl840316@gmail.com%' AND restaurant_id IS NULL;

-- 7. RECARGAR DATOS
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ USUARIOS REGENERADOS LIMPIOS. Tu cuenta jajl84 está intacta.' as estado;
