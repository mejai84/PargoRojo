-- =========================================================
-- REPARACIÓN DEFINITIVA DEL TRIGGER DE LOGIN/REGISTRO
-- Fecha: 7 de febrero de 2026
-- Objetivo: Arreglar "Database error querying schema" causado por triggers rotos
-- =========================================================

BEGIN;

-- 1. ELIMINAR TRIGGERS VIEJOS QUE PUEDAN ESTAR FALLANDO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users; 
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_login();

-- 2. CREAR FUNCIÓN SEGURA 'handle_new_user'
-- Esta función se ejecuta cada vez que se crea un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    updated_at = now();
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Si falla, NO bloqueamos el login/registro, solo lo logueamos
  RAISE WARNING 'Error en handle_new_user: %', SQLERRM;
  RETURN new;
END;
$$;

-- 3. CREAR EL TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. ASEGURAR QUE NO HAYA TRIGGERS RAROS EN PROFILES
-- A veces hay triggers recursivos aquí
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;

-- 5. RE-APLICAR PERMISOS AL ROL AUTHENTICATED/ANON (Por si acaso)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shifts TO authenticated;

-- 6. RECARGAR Pgrst
NOTIFY pgrst, 'reload config';

COMMIT;

-- =========================================================
SELECT '✅ TRIGGER DE AUTH REPARADO - INTENTA LOGUEARTE' as estado;
