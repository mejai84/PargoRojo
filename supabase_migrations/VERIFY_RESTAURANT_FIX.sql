-- =========================================================
-- VERIFICACIÓN DE CORRECCIÓN DE RESTAURANTE
-- =========================================================

SELECT 
    '1. Tabla Restaurants' as elemento,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurants') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as estado,
    'Debe existir para que el sistema funcione' as nota

UNION ALL

SELECT 
    '2. Columna restaurant_id en Profiles',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'restaurant_id') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE (CRÍTICO)' 
    END,
    'Causa principal del error de esquema'

UNION ALL

SELECT 
    '3. Datos de Restaurante (Pargo Rojo)',
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.restaurants WHERE subdomain = 'pargo-rojo') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END,
    'El restaurante por defecto'

UNION ALL

SELECT 
    '4. Asignación a Ana Caja',
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'ana.caja@pargorojo.com' AND restaurant_id IS NOT NULL) 
        THEN '✅ ASIGNADO' 
        ELSE '⚠️ SIN ASIGNAR' 
    END,
    'Ana debe tener un restaurant_id asignado';
