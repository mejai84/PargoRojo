-- =========================================================
-- DIAGNÓSTICO: Buscar tabla de pagos
-- Error: relation "public.payments" does not exist
-- =========================================================

-- 1. Listar todas las tablas que contengan 'pay' o 'sale'
SELECT 
    table_schema,
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND (table_name ILIKE '%pay%' OR table_name ILIKE '%sale%')
ORDER BY table_name;
