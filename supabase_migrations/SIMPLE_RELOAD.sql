-- =========================================================
-- RECARGA SIMPLE DE POSTGREST
-- =========================================================

-- Forzar múltiples notificaciones a PostgREST
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- Verificar tablas críticas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'settings', 'restaurants');

SELECT '✅ Notificaciones enviadas. Espera 30 segundos y prueba el login.' as resultado;
