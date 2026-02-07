-- =========================================================
-- RESTAURACIÓN FINAL Y SEGURA (Blindaje)
-- Fecha: 7 de febrero de 2026
-- Objetivo: Reactivar seguridad RLS y Trigger de registro (Versión Corregida)
-- =========================================================

BEGIN;

-- 1. REACTIVAR RLS (SEGURIDAD)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS DE 'PROFILES' (LECTURA PÚBLICA PARA EVITAR RECURSIÓN)
DROP POLICY IF EXISTS "profiles_read_all_auth" ON profiles;
CREATE POLICY "profiles_read_all_auth" ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 3. POLÍTICAS DE 'SHIFTS' (SOLO MIS TURNOS)
DROP POLICY IF EXISTS "shifts_read_own" ON shifts;
CREATE POLICY "shifts_read_own" ON shifts FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "shifts_write_own" ON shifts;
CREATE POLICY "shifts_write_own" ON shifts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "shifts_update_own" ON shifts;
CREATE POLICY "shifts_update_own" ON shifts FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 4. RESTAURAR TRIGGER DE NUEVO USUARIO (VERSION SEGURA)
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
  SET email = EXCLUDED.email, updated_at = now();
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Si falla, NO bloquear el registro auth
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. RECARGA FINAL
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ SISTEMA BLINDADO Y FUNCIONAL' as estado;
