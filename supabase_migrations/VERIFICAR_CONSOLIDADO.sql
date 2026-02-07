-- =========================================================
-- VERIFICACIÓN CONSOLIDADA EN UN SOLO RESULTADO
-- =========================================================

-- Crear una tabla temporal para consolidar resultados
CREATE TEMP TABLE IF NOT EXISTS verificacion_resultados (
    categoria TEXT,
    detalle TEXT,
    estado TEXT
);

-- 1. Verificar tablas
INSERT INTO verificacion_resultados
SELECT 
    'TABLAS' as categoria,
    tablename as detalle,
    '✅ Existe' as estado
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'settings', 'restaurants', 'products');

-- 2. Contar registros en profiles
INSERT INTO verificacion_resultados
SELECT 
    'DATOS' as categoria,
    'Total de profiles' as detalle,
    COUNT(*)::TEXT as estado
FROM public.profiles;

-- 3. Verificar usuario de prueba en auth.users
INSERT INTO verificacion_resultados
SELECT 
    'USUARIO AUTH' as categoria,
    'clara.caja@pargorojo.com' as detalle,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'clara.caja@pargorojo.com') 
        THEN '✅ Existe en auth.users'
        ELSE '❌ NO existe'
    END as estado;

-- 4. Verificar perfil del usuario
INSERT INTO verificacion_resultados
SELECT 
    'PERFIL' as categoria,
    'Email: ' || COALESCE(email, 'NO ENCONTRADO') as detalle,
    'Role: ' || COALESCE(role, 'N/A') as estado
FROM public.profiles
WHERE email = 'clara.caja@pargorojo.com'
LIMIT 1;

-- 5. Verificar RLS en tablas
INSERT INTO verificacion_resultados
SELECT 
    'RLS' as categoria,
    tablename as detalle,
    CASE 
        WHEN rowsecurity THEN '🔒 Habilitado'
        ELSE '🔓 Deshabilitado'
    END as estado
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'settings', 'restaurants');

-- Mostrar todos los resultados
SELECT * FROM verificacion_resultados ORDER BY categoria, detalle;

-- Limpiar
DROP TABLE verificacion_resultados;
