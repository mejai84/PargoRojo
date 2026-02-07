-- =========================================================
-- DIAGNÓSTICO PROFUNDO DE POSTGREST
-- Ejecutar DESPUÉS del reinicio si el error persiste
-- =========================================================

-- 1. Verificar que el rol authenticator puede ver el schema
SET ROLE authenticator;
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('public', 'auth', 'extensions');
RESET ROLE;

-- 2. Verificar grants específicos en information_schema
SELECT 
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'authenticator'
AND table_schema = 'public'
LIMIT 10;

-- 3. Verificar que las tablas son visibles para anon
SET ROLE anon;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
LIMIT 5;
RESET ROLE;

-- 4. Verificar configuración de PostgREST en pg_settings
SELECT name, setting 
FROM pg_settings 
WHERE name LIKE '%search_path%';

-- 5. Verificar políticas RLS problemáticas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT '✅ DIAGNÓSTICO COMPLETADO' as estado;
