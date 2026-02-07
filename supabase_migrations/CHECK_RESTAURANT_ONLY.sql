-- Verificar datos del restaurante
SELECT 
    id,
    name,
    subdomain,
    logo_url,
    primary_color,
    LENGTH(primary_color) as color_length,
    CASE 
        WHEN primary_color LIKE '#%' THEN '✅ Formato correcto'
        ELSE '❌ Formato incorrecto'
    END as formato_color
FROM public.restaurants;
