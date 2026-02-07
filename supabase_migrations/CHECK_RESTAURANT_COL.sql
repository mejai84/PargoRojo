-- VERIFICAR EXISTENCIA DE COLUMNA RESTAURANT_ID EN PROFILES
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'restaurant_id';
