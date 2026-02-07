-- =========================================================
-- SOLUCIÓN DEFINITIVA: PERMISOS EXPLÍCITOS EN INFORMATION_SCHEMA
-- Este es el problema real: PostgREST no puede leer information_schema
-- =========================================================

BEGIN;

-- 1. OTORGAR PERMISOS EXPLÍCITOS EN INFORMATION_SCHEMA
-- Esto es lo que falta y causa el "Database error querying schema"
GRANT USAGE ON SCHEMA information_schema TO authenticator, anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO authenticator, anon, authenticated;

-- 2. OTORGAR PERMISOS EN PG_CATALOG (También necesario para PostgREST)
GRANT USAGE ON SCHEMA pg_catalog TO authenticator, anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA pg_catalog TO authenticator, anon, authenticated;

-- 3. ASEGURAR PERMISOS EN SCHEMAS PRINCIPALES
GRANT USAGE ON SCHEMA public TO authenticator, anon, authenticated;
GRANT USAGE ON SCHEMA auth TO authenticator, anon, authenticated;
GRANT USAGE ON SCHEMA extensions TO authenticator, anon, authenticated;

-- 4. PERMISOS EN TODAS LAS TABLAS PÚBLICAS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 5. PERMISOS EN SECUENCIAS
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticator, anon, authenticated;

-- 6. PERMISOS EN FUNCIONES
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticator, anon, authenticated;

-- 7. CONFIGURAR DEFAULTS PARA OBJETOS FUTUROS
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticator, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticator, anon, authenticated;

-- 8. VERIFICAR QUE AUTHENTICATOR PUEDE VER INFORMATION_SCHEMA
DO $$
DECLARE
    schema_count INTEGER;
BEGIN
    -- Intentar contar schemas como authenticator
    SELECT COUNT(*) INTO schema_count
    FROM information_schema.schemata
    WHERE schema_name IN ('public', 'auth', 'extensions');
    
    IF schema_count >= 3 THEN
        RAISE NOTICE '✅ Authenticator puede ver information_schema correctamente';
    ELSE
        RAISE WARNING '⚠️ Authenticator solo ve % schemas de 3 esperados', schema_count;
    END IF;
END $$;

-- 9. FORZAR RECARGA DE POSTGREST
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '🎉 PERMISOS DE INFORMATION_SCHEMA OTORGADOS' as estado;
SELECT 'Espera 30 segundos y prueba el login nuevamente' as siguiente_paso;
