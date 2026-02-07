-- Verificar el contenido de settings
SELECT 
    key,
    value,
    pg_typeof(value) as tipo_dato,
    LENGTH(value) as longitud
FROM public.settings
ORDER BY key;
