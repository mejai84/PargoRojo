
-- Paso temporal para diagnosticar si el problema es RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';
