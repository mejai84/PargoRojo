
// Step 11: Waiter PIN
export const MIGRATION_STEP_11 = `
-- Agregar columna de PIN a perfiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS waiter_pin TEXT;
COMMENT ON COLUMN public.profiles.waiter_pin IS 'PIN de 4 dígitos para acceso rápido al portal de meseros.';
`;

// 129: Repair Multi-Tenancy (and Schema Reload helper)
export const MIGRATION_129 = `
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

INSERT INTO public.restaurants (id, name, subdomain)
VALUES ('d8616ce5-7651-44ea-814a-96f09e32e8be', 'Jamali OS Default', 'jamali')
ON CONFLICT (id) DO NOTHING;

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
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl_name AND column_name = 'restaurant_id') THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id)', tbl_name);
                EXECUTE format('UPDATE public.%I SET restaurant_id = %L WHERE restaurant_id IS NULL', tbl_name, target_res_id);
            END IF;
        END IF;
    END LOOP;
END $$;

ALTER TABLE public.shifts DROP CONSTRAINT IF EXISTS shifts_shift_type_check;
ALTER TABLE public.shifts ADD CONSTRAINT shifts_shift_type_check 
    CHECK (shift_type IN ('MORNING', 'AFTERNOON', 'NIGHT', 'CUSTOM', 'Mañana', 'Tarde', 'Noche', 'General'));

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
NOTIFY pgrst, 'reload schema';
`;
