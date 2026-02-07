-- =========================================================
-- ESCANEO POST-VICTORIA
-- Objetivo: Ver qué falta restaurar (Columnas, RLS, Funciones)
-- =========================================================

SELECT 
    '1. Columna restaurant_id' as elemento,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'restaurant_id') 
        THEN '✅ EXISTE' 
        ELSE '❌ FALTA (HAY QUE CREARLA)' 
    END as estado

UNION ALL

SELECT 
    '2. Seguridad RLS (Profiles)',
    CASE 
        WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles') 
        THEN '✅ ACTIVA' 
        ELSE '⚠️ DESACTIVADA (PELIGRO)' 
    END

UNION ALL

SELECT 
    '3. Trigger Nuevo Usuario',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
        THEN '✅ EXISTE' 
        ELSE '❌ FALTA (EL REGISTRO NO FUNCIONARÁ)' 
    END;
