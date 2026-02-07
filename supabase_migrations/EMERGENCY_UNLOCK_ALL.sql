-- =========================================================
-- 🚨 EMERGENCIA: APAGADO DE RLS PARA DESBLOQUEO TOTAL
-- Fecha: 7 de febrero de 2026
-- Objetivo: Permitir el login INMEDIATO de Ana (Caja)
-- =========================================================

BEGIN;

-- 1. APAGAR RLS EN TABLAS DE ACCESO
-- Esto permite que CUALQUIER usuario lea/escriba en estas tablas
-- Es temporal hasta que logres entrar.
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;

-- 2. ASEGURAR PERMISOS BÁSICOS
-- A veces el error es simplemente que el rol no tiene permiso de "USAGE"
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- 3. RECARGAR LA CONFIGURACIÓN DE LA API
NOTIFY pgrst, 'reload config';

COMMIT;

-- =========================================================
-- DIAGNÓSTICO DE COLUMNAS (Para saber cómo arreglarlo bien después)
-- =========================================================
SELECT 
    table_name, 
    column_name 
FROM information_schema.columns 
WHERE table_name = 'shifts' 
AND column_name IN ('user_id', 'employee_id', 'staff_id', 'profile_id');

SELECT '✅ SEGURIDAD DESACTIVADA - INTENTA ENTRAR AHORA' as resultado;
