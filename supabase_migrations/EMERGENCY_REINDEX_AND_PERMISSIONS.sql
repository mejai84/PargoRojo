-- =========================================================
-- SOLUCIÓN DE EMERGENCIA: REINDEXADO Y PERMISOS TOTALES
-- Objetivo: Arreglar corrupción de esquema o permisos rotos
-- =========================================================

-- 1. Intentar limpiar caché de planes
DISCARD PLANS;
DISCARD SEQUENCES;
DISCARD TEMP;

-- 2. Asegurar que los roles básicos existen y tienen acceso
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- 3. PERMISOS TOTALES (Modo "Barra Libre" temporal para descartar problemas)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Asegurar acceso a information_schema (Crítico para PostgREST)
GRANT USAGE ON SCHEMA information_schema TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO anon, authenticated, service_role;

-- 5. Reindexar tablas críticas del sistema (Puede tardar unos segundos)
REINDEX TABLE pg_catalog.pg_class;
REINDEX TABLE pg_catalog.pg_attribute;
REINDEX TABLE pg_catalog.pg_namespace;

-- 6. Forzar recarga de configuración
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

SELECT '✅ MANTENIMIENTO COMPLETADO: Índices regenerados y permisos forzados' as estado;
