-- =========================================================
-- SEGURIDAD ESTABLE FINAL (LECTURA PÚBLICA DE PERFILES)
-- =========================================================

BEGIN;

-- 1. ACTIVAR RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- 2. LIMPIAR POLÍTICAS VIEJAS
DROP POLICY IF EXISTS "profiles_read_simple" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "profiles_select_safe" ON profiles;

-- 3. LA REGLA DE ORO: LECTURA PÚBLICA PARA AUTENTICADOS 📖
-- Esto permite que el Login funcione SIEMPRE, sin recursión.
CREATE POLICY "profiles_read_all_auth" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- 4. ESCRITURA SEGURA 🔒
-- Solo el dueño edita
CREATE POLICY "profiles_update_own" 
ON profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 5. INSERTAR SEGURO ➕
CREATE POLICY "profiles_insert_own" 
ON profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- 6. PERMISOS DE SHIFTS SIMPLIFICADOS
DROP POLICY IF EXISTS "shifts_select_own" ON shifts;
-- Ver mis turnos O ver todos si soy manager/admin (sin recursión compleja)
CREATE POLICY "shifts_read_policy" 
ON shifts FOR SELECT TO authenticated 
USING (
    user_id = auth.uid() 
    OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

COMMIT;

-- =========================================================
SELECT '✅ SEGURIDAD RESTAURADA Y ESTABILIZADA' as fin;
