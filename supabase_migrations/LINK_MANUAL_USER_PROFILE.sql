-- =========================================================
-- VINCULACIÓN DE PERFIL PARA USUARIO MANUAL
-- Objetivo: Crear perfil público para admin.demo@pargorojo.com
-- =========================================================

INSERT INTO public.profiles (id, email, full_name, role, restaurant_id, created_at)
SELECT 
    id, -- Usamos el MISMO ID que generó Supabase (Vital para que coincidan)
    email,
    'Admin Demo', -- Nombre para mostrar
    'admin', -- Rol en la App
    (SELECT id FROM public.restaurants LIMIT 1), -- Asignar al primer restaurante
    NOW()
FROM auth.users
WHERE email = 'admin.demo@pargorojo.com'
ON CONFLICT (id) DO UPDATE -- Si ya existe, solo actualizamos
SET role = 'admin',
    restaurant_id = (SELECT id FROM public.restaurants LIMIT 1);

-- Verificación
SELECT * FROM public.profiles WHERE email = 'admin.demo@pargorojo.com';
