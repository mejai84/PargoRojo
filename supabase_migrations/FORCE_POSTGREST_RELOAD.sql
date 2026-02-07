-- =========================================================
-- FORZAR RECARGA DE POSTGREST Y VERIFICAR CONFIGURACIÓN
-- =========================================================

-- 1. Verificar que los roles tienen el search_path correcto
SELECT rolname, rolconfig 
FROM pg_roles 
WHERE rolname IN ('authenticator', 'anon', 'authenticated');

-- 2. Verificar permisos en el schema public
SELECT 
    grantee, 
    string_agg(privilege_type, ', ') as privileges
FROM information_schema.schema_privileges
WHERE schema_name = 'public'
AND grantee IN ('anon', 'authenticated', 'authenticator')
GROUP BY grantee;

-- 3. Verificar que las tablas críticas existen y tienen permisos
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'settings', 'restaurants')
AND grantee IN ('anon', 'authenticated', 'authenticator')
ORDER BY table_name, grantee;

-- 4. FORZAR NOTIFICACIÓN A POSTGREST (múltiples veces para asegurar)
DO $$
BEGIN
    PERFORM pg_notify('pgrst', 'reload schema');
    PERFORM pg_notify('pgrst', 'reload config');
    RAISE NOTICE '✅ Notificaciones enviadas a PostgREST';
END $$;

-- 5. Verificar estado de RLS en tablas críticas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'settings', 'restaurants', 'products');

SELECT '✅ VERIFICACIÓN COMPLETADA - Revisa los resultados arriba' as estado;
