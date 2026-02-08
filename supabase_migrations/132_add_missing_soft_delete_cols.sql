-- ========================================================
-- MIGRACIÓN 132: REPARACIÓN DE COLUMNAS DE SOFT DELETE
-- Fecha: 9 de febrero de 2026
-- Propósito: Añadir 'deleted_at' a tablas que lo requieren según el código.
-- ========================================================

DO $$ 
DECLARE 
    tbl_name TEXT;
    tables_to_fix TEXT[] := ARRAY[
        'products', 'categories', 'tables', 
        'ingredients', 'recipes', 'customers', 
        'reservations', 'orders', 'shifts'
    ];
BEGIN 
    FOREACH tbl_name IN ARRAY tables_to_fix LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl_name AND column_name = 'deleted_at') THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE', tbl_name);
                RAISE NOTICE 'Añadida columna deleted_at a %', tbl_name;
            END IF;
        END IF;
    END LOOP;
END $$;

-- Recargar esquema
NOTIFY pgrst, 'reload schema';
