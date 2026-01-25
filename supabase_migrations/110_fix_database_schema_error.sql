-- =============================================
-- FIX FOR "Database error querying schema"
-- Eliminamos recursión circular en políticas RLS y funciones
-- =============================================

-- 1. Crear funciones SECURITY DEFINER robustas para evitar recursión
-- Estas funciones se ejecutan con privilegios de superusuario y no disparan RLS
CREATE OR REPLACE FUNCTION public.check_user_role(target_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = target_role
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Limpiar y recrear políticas de public.profiles (El origen del error)
-- El error suele ocurrir porque una política de SELECT en profiles hace un SELECT en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Política segura: El usuario siempre puede ver su propia fila por ID
CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- Política segura: Los admins pueden ver a todos usando la función SECURITY DEFINER (evita circularidad)
CREATE POLICY "Admins can view all profiles" ON public.profiles 
FOR SELECT USING (public.check_user_is_admin());

-- 3. Actualizar políticas en otras tablas críticas para usar la función segura
-- Tabla: cashboxes
DROP POLICY IF EXISTS "Admins can modify cashboxes" ON public.cashboxes;
CREATE POLICY "Admins can modify cashboxes"
ON public.cashboxes FOR ALL
USING (public.check_user_role('admin') OR public.check_user_role('owner') OR public.check_user_role('cashier'));

-- Tabla: shifts
DROP POLICY IF EXISTS "Admins manage payroll" ON public.shifts;
CREATE POLICY "Admins manage payroll" ON public.shifts 
FOR ALL USING (public.check_user_is_admin());

-- 4. Asegurar que las contraseñas de los usuarios demo sean las correctas (PargoRojo2024!)
-- Solo si la extensión pgcrypto está disponible
CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE auth.users 
SET encrypted_password = crypt('PargoRojo2024!', gen_salt('bf'))
WHERE email IN (
    'andres.mesero@pargorojo.com', 
    'elena.chef@pargorojo.com', 
    'ana.caja@pargorojo.com',
    'gerencia.comercial@pargorojo.com'
);

-- 5. Forzar recarga del cache de PostgREST
NOTIFY pgrst, 'reload schema';

-- 6. Comentar para logs
COMMENT ON FUNCTION public.check_user_is_admin IS 'Verificación de rol admin sin recursión RLS';
