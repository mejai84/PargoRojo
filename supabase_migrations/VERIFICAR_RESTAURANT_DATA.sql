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

-- Verificar que los usuarios tienen restaurant_id
SELECT 
    email,
    role,
    restaurant_id,
    CASE 
        WHEN restaurant_id IS NOT NULL THEN '✅ Tiene restaurant_id'
        ELSE '❌ Sin restaurant_id'
    END as estado
FROM public.profiles
ORDER BY email;
