-- =========================================================
-- REACTIVACIÓN DE SEGURIDAD SEGURA (SIN RECURSIÓN)
-- Fecha: 7 de febrero de 2026
-- Objetivo: Reactivar RLS pero evitando el "Schema Error" en perfiles de Staff
-- =========================================================

BEGIN;

-- 1. REACTIVAR RLS EN TABLAS CRÍTICAS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY; 
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 2. LIMPIEZA TOTAL DE POLÍTICAS EN PROFILES (Borrón y cuenta nueva)
-- Esto asegura que no quede ninguna política recursiva vieja "zombie"
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_read_simplest" ON profiles;
DROP POLICY IF EXISTS "profiles_read_simple" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;

-- 3. CREAR POLÍTICAS "ZERO RECURSION" PARA PROFILES 🛡️
-- La clave: NO consultar ninguna tabla en la política SELECT
-- Permitimos que cualquier usuario autenticado lea los perfiles (nombres, roles)
-- Esto es necesario para que Meseros/Cajeros verifiquen sus propios permisos

CREATE POLICY "profiles_select_safe" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- Solo el dueño puede editar su perfil
CREATE POLICY "profiles_update_safe" 
ON profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Cualquiera puede insertar su propio perfil (al registrarse)
CREATE POLICY "profiles_insert_safe" 
ON profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Admin puede hacer todo (Usando una subconsulta segura que ahora NO fallará porque SELECT es público)
CREATE POLICY "profiles_admin_all" 
ON profiles 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- 4. POLÍTICAS BÁSICAS PARA SHIFTS (TURNOS)
-- Limpiamos anteriores para evitar conflictos
DROP POLICY IF EXISTS "shifts_select_own" ON shifts;
DROP POLICY IF EXISTS "shifts_insert_own" ON shifts;
DROP POLICY IF EXISTS "shifts_update_own" ON shifts;
DROP POLICY IF EXISTS "shifts_select_admin" ON shifts;

-- Cajeros ven sus propios turnos
CREATE POLICY "shifts_select_own" 
ON shifts FOR SELECT TO authenticated 
USING (user_id = auth.uid());

-- Cajeros pueden iniciar/cerrar sus turnos
CREATE POLICY "shifts_insert_own" 
ON shifts FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "shifts_update_own" 
ON shifts FOR UPDATE TO authenticated 
USING (user_id = auth.uid());

-- Admin/Managers ven todos los turnos (Seguro ahora que profiles es legible)
CREATE POLICY "shifts_all_admin" 
ON shifts FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
);

-- 5. RECARGA FINAL DE CACHÉ
NOTIFY pgrst, 'reload config';

COMMIT;

-- =========================================================
-- CONFIRMACIÓN
-- =========================================================
SELECT '✅ Seguridad Reactivada y Optimizada' as estado;
