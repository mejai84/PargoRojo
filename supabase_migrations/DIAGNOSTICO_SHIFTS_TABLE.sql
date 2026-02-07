-- =========================================================
-- DIAGNÓSTICO: Error en tabla shifts
-- Error: Could not find 'start_time' column
-- =========================================================

-- 1. Ver estructura actual de la tabla shifts
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'shifts'
ORDER BY ordinal_position;

-- 2. Ver los primeros registros
SELECT * FROM public.shifts LIMIT 5;

-- 3. Verificar si existe la tabla shift_definitions
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'shift_definitions'
ORDER BY ordinal_position;

-- 4. Ver shift_definitions
SELECT * FROM public.shift_definitions LIMIT 10;
