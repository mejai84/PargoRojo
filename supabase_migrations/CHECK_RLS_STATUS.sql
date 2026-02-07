-- Verificar si RLS está habilitado
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '🔒 Habilitado (Posible Causa del Error)'
        ELSE '✅ Deshabilitado'
    END as estado
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'settings', 'restaurants');
