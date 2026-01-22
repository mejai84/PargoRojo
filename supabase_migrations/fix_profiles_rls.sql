-- FIX RLS ON PROFILES
-- El problema es que probablemente solo existe una política para ver el propio perfil.
-- Necesitamos permitir que los administradores vean TODOS los perfiles.

-- Uso de SECURITY DEFINER para evitar recursión infinita en las políticas
CREATE OR REPLACE FUNCTION public.is_admin_check()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Ver propio perfil (Ya debe existir, pero lo aseguramos)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- 2. Administradores pueden ver TODO (Para la lista de empleados)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles 
FOR SELECT USING (public.is_admin_check());

-- 3. Administradores pueden editar perfiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles 
FOR UPDATE USING (public.is_admin_check());

-- 4. Administradores pueden insertar (si hiciera falta, aunque suele ser por trigger)
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles 
FOR INSERT WITH CHECK (public.is_admin_check());

-- 5. Meseros y Staff pueden ver perfiles básicos? (Opcional, para asignar meseros)
-- Por ahora solo admins gestionan empleados.
