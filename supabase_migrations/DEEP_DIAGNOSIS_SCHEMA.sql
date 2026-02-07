-- =========================================================
-- DIAGNÓSTICO PROFUNDO DE ERROR DE ESQUEMA
-- =========================================================

-- 1. VERIFICAR SI LA TABLA PROFILES EXISTE Y TIENE COLUMNAS
SELECT 
    'Tabla Profiles' as elemento,
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- 2. VERIFICAR SI LA TABLA SHIFTS EXISTE Y TIENE COLUMNAS
SELECT 
    'Tabla Shifts' as elemento,
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'shifts';

-- 3. INTENTAR UNA CONSULTA DIRECTA (COMO SI FUERA EL LOGIN)
-- Esto verifica si hay datos y si se pueden leer
DO $$
DECLARE
    v_count integer;
BEGIN
    SELECT count(*) INTO v_count FROM profiles;
    RAISE NOTICE '✅ Lectura de profiles exitosa. Registros: %', v_count;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERROR LECTURA PROFILES: %', SQLERRM;
END $$;

-- 4. INTENTAR CONSULTA DE SHIFTS
DO $$
DECLARE
    v_count integer;
BEGIN
    SELECT count(*) INTO v_count FROM shifts;
    RAISE NOTICE '✅ Lectura de shifts exitosa. Registros: %', v_count;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERROR LECTURA SHIFTS: %', SQLERRM;
END $$;

-- 5. VERIFICAR EL PRELOAD DE LA API (PostgREST)
-- A veces PostgREST falla si hay una función rota en el esquema 'public'
-- Vamos a listar funciones que podrían estar "sucias"
SELECT 
    proname as funcion_sospechosa, 
    prosrc as codigo 
FROM pg_proc 
JOIN pg_namespace ns ON pg_proc.pronamespace = ns.oid 
WHERE ns.nspname = 'public' 
AND prosrc ILIKE '%search_path%';

-- 6. INTENTO DESESPERADO: RECREAR EL ROL ANON
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;

SELECT '✅ DIAGNÓSTICO FINALIZADO. REVISA LOS MENSAJES (MESSAGES) ABAJO' as fin;
