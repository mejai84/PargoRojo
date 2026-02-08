-- ========================================================
-- MIGRACIÓN 129: REPARACIÓN DE INFRAESTRUCTURA MULTI-TENANT
-- Fecha: 8 de febrero de 2026
-- Propósito: Asegurar que TODAS las tablas tengan restaurant_id para el aislamiento SaaS total.
-- ========================================================

-- 1. Asegurar que existe la tabla de Restaurantes
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255) UNIQUE,
    logo_url TEXT,
    primary_color VARCHAR(50) DEFAULT '#FF6B35',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Restaurante por defecto (Legacy support)
INSERT INTO public.restaurants (id, name, subdomain)
VALUES ('d8616ce5-7651-44ea-814a-96f09e32e8be', 'Jamali OS Default', 'jamali')
ON CONFLICT (id) DO NOTHING;

-- 3. Función Helper para asignar restaurante por defecto
DO $$ 
DECLARE 
    tbl_name TEXT;
    target_res_id UUID := 'd8616ce5-7651-44ea-814a-96f09e32e8be';
    tables_to_fix TEXT[] := ARRAY[
        'shifts', 'orders', 'products', 'categories', 'tables', 
        'cashbox_sessions', 'cash_movements', 'cashboxes',
        'ingredients', 'recipes', 'inventory_movements', 
        'petty_cash_vouchers', 'reservations', 'audit_logs',
        'shift_definitions', 'customers'
    ];
BEGIN 
    FOREACH tbl_name IN ARRAY tables_to_fix LOOP
        -- Verificar si la tabla existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            -- Añadir columna restaurant_id si no existe
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl_name AND column_name = 'restaurant_id') THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id)', tbl_name);
                
                -- Llenar datos existentes con el restaurante por defecto
                EXECUTE format('UPDATE public.%I SET restaurant_id = %L WHERE restaurant_id IS NULL', tbl_name, target_res_id);
            END IF;
        END IF;
    END LOOP;
END $$;

-- 4. Corregir Restricción de 'shifts' (Permitir nombres de turnos en español de las definiciones)
ALTER TABLE public.shifts DROP CONSTRAINT IF EXISTS shifts_shift_type_check;
ALTER TABLE public.shifts ADD CONSTRAINT shifts_shift_type_check 
    CHECK (shift_type IN ('MORNING', 'AFTERNOON', 'NIGHT', 'CUSTOM', 'Mañana', 'Tarde', 'Noche', 'General'));

-- 5. Crear la función exec_sql para futuros mantenimientos
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $body$
BEGIN
  EXECUTE query;
  RETURN json_build_object('status', 'success');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$body$;

GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- 6. Recargar esquema
NOTIFY pgrst, 'reload schema';
