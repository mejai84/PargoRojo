-- =========================================================
-- FIX CRÍTICO: "Database error querying schema"
-- Fecha: 7 de febrero de 2026
-- Causa: Recursión infinita en políticas RLS de 'profiles'
-- =========================================================

-- 1. ELIMINAR POLÍTICAS PROBLEMÁTICAS EN PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow individual read access" ON profiles;
DROP POLICY IF EXISTS "Allow individual update access" ON profiles;
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- 2. CREAR POLÍTICAS NO-RECURSIVAS (SIMPLIFICADAS)

-- Lectura: Cualquiera autenticado puede leer perfiles básicos
-- Esto rompe el ciclo porque no verifica "role" consultando la misma tabla
CREATE POLICY "profiles_read_simple" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- Escritura: Solo el propio usuario puede editar su perfil
CREATE POLICY "profiles_update_own" 
ON profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Inserción: Cualquiera autenticado puede crear su perfil (al registrarse)
CREATE POLICY "profiles_insert_own" 
ON profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- 3. FORZAR RECARGA DE SCHEMA CACHE
NOTIFY pgrst, 'reload config';

-- 4. VERIFICACIÓN DE PERMISOS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- =========================================================
-- RESUMEN
-- =========================================================
SELECT '✅ Políticas RLS de profiles simplificadas y caché recargado' as resultado;
