-- ACTUALIZAR CONSTRAINTS DE ROLES
-- Este script permite que los perfiles acepten nuevos roles (mesero, cocinero, etc.)

-- 1. Eliminar el constraint antiguo si existe
DO $$ BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- 2. Añadir el nuevo constraint con todos los roles necesarios para el restaurante
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin', 'staff', 'cashier', 'waiter', 'cook', 'cleaner', 'manager', 'chef', 'host'));

-- NOTA: No insertamos usuarios manualmente aquí para evitar errores de Foreign Key.
-- Para crear empleados, usa el módulo de "Empleados" en el panel administrativo.
