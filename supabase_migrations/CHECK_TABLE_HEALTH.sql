-- =========================================================
-- CHEQUEO DE SALUD DE TABLAS (BUSCANDO ZOMBIES)
-- Objetivo: Ver si podemos leer las tablas o si dan error SQL
-- =========================================================

-- 1. Intentar leer 1 fila de Products
DO $$
BEGIN
    PERFORM * FROM public.products LIMIT 1;
    RAISE NOTICE '✅ Tabla PRODUCTS: OK';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌❌ TABLA PRODUCTS ROTA: %', SQLERRM;
END $$;

-- 2. Intentar leer 1 fila de Profiles
DO $$
BEGIN
    PERFORM * FROM public.profiles LIMIT 1;
    RAISE NOTICE '✅ Tabla PROFILES: OK';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌❌ TABLA PROFILES ROTA: %', SQLERRM;
END $$;

-- 3. Intentar leer 1 fila de Orders
DO $$
BEGIN
    PERFORM * FROM public.orders LIMIT 1;
    RAISE NOTICE '✅ Tabla ORDERS: OK';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌❌ TABLA ORDERS ROTA: %', SQLERRM;
END $$;

-- 4. Ver si hay columnas generadas que dependan de funciones borradas
SELECT 
    table_name, 
    column_name, 
    generation_expression
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND is_generated = 'ALWAYS';

SELECT 'Diagnóstico completado. Revisa la pestaña Messages.' as estado;
