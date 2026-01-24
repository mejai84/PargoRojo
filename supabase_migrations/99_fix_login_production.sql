-- =============================================
-- FIX FOR PRODUCTION LOGIN ERRORS
-- "Database error querying schema" often caused by RLS circularity 
-- or constraint violations in profiles.
-- =============================================

-- 1. Remove restrictive role check if it exists
DO $$ 
BEGIN 
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
EXCEPTION 
    WHEN undefined_object THEN NULL;
END $$;

-- 2. Ensure role column allows any string (we use RBAC system now)
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'customer';

-- 3. Robust Permission Check (Avoids circularity and relies on roles system)
CREATE OR REPLACE FUNCTION public.user_has_permission(
    user_id_input UUID,
    permission_name_input TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    -- We use a simple query that bypasses RLS within the function
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        JOIN public.role_permissions rp ON p.role_id = rp.role_id
        JOIN public.permissions perm ON rp.permission_id = perm.id
        WHERE p.id = user_id_input
        AND perm.name = permission_name_input
    ) INTO has_perm;
    
    -- Fallback to legacy TEXT role check if role_id is not set
    IF NOT has_perm THEN
        SELECT EXISTS (
            SELECT 1
            FROM public.profiles p
            JOIN public.roles r ON p.role = r.name
            JOIN public.role_permissions rp ON r.id = rp.role_id
            JOIN public.permissions perm ON rp.permission_id = perm.id
            WHERE p.id = user_id_input
            AND perm.name = permission_name_input
        ) INTO has_perm;
    END IF;

    RETURN COALESCE(has_perm, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fix profiles RLS to be super safe
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles 
FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 5. Force reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
