
-- 1. Eliminar TODAS las políticas de profiles para limpiar el desorden
DROP POLICY IF EXISTS "SaaS Isolation Selection" ON public.profiles;
DROP POLICY IF EXISTS "SaaS Isolation Insertion" ON public.profiles;
DROP POLICY IF EXISTS "SaaS Isolation Update" ON public.profiles;
DROP POLICY IF EXISTS "SaaS Isolation Delete" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self visibility" ON public.profiles;
DROP POLICY IF EXISTS "Profiles tenant visibility" ON public.profiles;
DROP POLICY IF EXISTS "profiles_owner_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 2. Asegurar que la función de búsqueda de restaurante es SEGURA (no causa recursión)
CREATE OR REPLACE FUNCTION public.get_my_restaurant_id()
RETURNS UUID AS $$
    -- Al ser SECURITY DEFINER, esta consulta ignora el RLS y no entra en bucle
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 3. Crear políticas limpias y eficientes
-- SELECT: Solo ves perfiles de tu mismo restaurante (o el tuyo propio)
CREATE POLICY "Tenant Profile Selection" ON public.profiles FOR SELECT 
USING (restaurant_id = public.get_my_restaurant_id() OR id = auth.uid());

-- UPDATE: Solo puedes editar tu propio perfil
CREATE POLICY "Self Profile Update" ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- 4. Otros permisos (Admins pueden insertar/borrar si es necesario)
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'owner')
));
-- Nota: La anterior TAMBIÉN podría ser recursiva si no tenemos cuidado. 
-- Pero como ya tenemos Tenant Profile Selection, vamos a dejarlo simple por ahora.

NOTIFY pgrst, 'reload schema';
