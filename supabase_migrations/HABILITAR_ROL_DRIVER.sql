-- HABILITAR ROL: DOMICILIARIO (driver)

BEGIN;

-- 1. Actualizar restricción de roles en Profiles (si existe)
-- Primero intentamos eliminar la restricción vieja si es un constraint CHECK
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
    END IF;
END $$;

-- Volvemos a crear el constraint con 'driver' incluido
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'manager', 'cashier', 'waiter', 'cook', 'chef', 'host', 'cleaner', 'driver', 'customer'));


-- 2. Asignar Permisos Granulares (si ya corriste el sistema de permisos)
INSERT INTO public.user_permissions (user_id, permission)
SELECT id, 'view_reports'::permission_type -- Damos un permiso dummy o específico si creamos 'access_driver_app'
FROM public.profiles WHERE role = 'driver'
ON CONFLICT DO NOTHING;

-- Nota: Como 'access_driver_app' no estaba en el ENUM original, 
-- usaremos la lógica de rol directo en el frontend por ahora.

COMMIT;

SELECT '✅ Rol Driver habilitado correctamente' as status;
