-- ========================================================
-- 🐟 MIGRACIÓN GLOBAL MULTI-TENANCY (DÍA 1 SaaS)
-- Propósito: Normalizar todas las tablas para aislamiento SaaS
-- ========================================================

-- 1. Asegurar que existe la tabla de Restaurantes
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255) UNIQUE,
    logo_url TEXT,
    primary_color VARCHAR(50) DEFAULT '#FF6B35',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear un restaurante por defecto si no hay ninguno
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM public.restaurants) THEN
        INSERT INTO public.restaurants (id, name, subdomain)
        VALUES ('00000000-0000-0000-0000-000000000000', 'Pargo Rojo Original', 'pargorojo');
    END IF;
END $$;

-- 3. Lista de tablas a las que se les debe añadir restaurant_id
-- Se utiliza un bloque anónimo para evitar errores si la columna ya existe
DO $$ 
DECLARE 
    tbl_name TEXT;
    tables_to_update TEXT[] := ARRAY[
        'customers', 'devices', 'shifts', 'cashboxes', 'cashbox_sessions', 
        'cash_movements', 'pos_sales', 'sale_payments', 'ingredients', 
        'recipes', 'inventory_movements', 'coupons', 'reservations', 
        'petty_cash_vouchers', 'notifications', 'loyalty_transactions', 
        'whatsapp_templates', 'customer_notifications', 'suppliers', 
        'inventory_purchases', 'inventory_purchase_items', 'inventory_waste', 
        'delivery_settings', 'delivery_drivers', 'order_deliveries', 
        'audit_logs', 'permissions', 'roles', 'role_permissions', 
        'combos', 'combo_items', 'addresses', 'cash_shifts', 
        'shift_balances', 'employee_liquidations', 'cashbox_audits'
    ];
    default_res_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN 
    FOREACH tbl_name IN ARRAY tables_to_update LOOP
        -- Verificar si la tabla existe antes de intentar modificarla
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            -- Añadir columna restaurant_id si no existe
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl_name AND column_name = 'restaurant_id') THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id) DEFAULT %L', tbl_name, default_res_id);
                -- Actualizar datos existentes
                EXECUTE format('UPDATE public.%I SET restaurant_id = %L WHERE restaurant_id IS NULL', tbl_name, default_res_id);
                -- Quitar el default para obligar a que sea explícito en inserts futuros o manejarlo vía RLS/Triggers
                EXECUTE format('ALTER TABLE public.%I ALTER COLUMN restaurant_id SET NOT NULL', tbl_name);
            END IF;
        END IF;
    END LOOP;
END $$;

-- 4. Función para obtener el restaurant_id del usuario actual (Helper RLS)
-- Se basa en que el perfil del usuario tiene su restaurant_id asignado
CREATE OR REPLACE FUNCTION public.get_my_restaurant_id()
RETURNS UUID AS $$
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Actualización Masiva de Políticas RLS para Aislamiento SaaS
-- Este bloque borra políticas antiguas de SELECTED tablas y crea las nuevas enfocadas en SaaS
DO $$ 
DECLARE 
    tbl_name TEXT;
    tables_to_rls TEXT[] := ARRAY[
        'profiles', 'orders', 'products', 'categories', 'tables', 'settings',
        'customers', 'devices', 'shifts', 'cashboxes', 'cashbox_sessions', 
        'cash_movements', 'pos_sales', 'sale_payments', 'ingredients', 
        'recipes', 'inventory_movements', 'coupons', 'reservations', 
        'petty_cash_vouchers', 'notifications', 'loyalty_transactions', 
        'whatsapp_templates', 'customer_notifications', 'suppliers', 
        'inventory_purchases', 'inventory_purchase_items', 'inventory_waste', 
        'delivery_settings', 'delivery_drivers', 'order_deliveries', 
        'audit_logs', 'roles', 'combos', 'addresses', 'cashbox_audits'
    ];
BEGIN 
    FOREACH tbl_name IN ARRAY tables_to_rls LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            -- Habilitar RLS (Idempotente)
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl_name);
            
            -- Borrar políticas de SELECT previas (Simplificado para el MVP SaaS)
            -- Nota: En producción esto debe ser más granulado
            EXECUTE format('DROP POLICY IF EXISTS "SaaS Isolation Selection" ON public.%I', tbl_name);
            EXECUTE format('DROP POLICY IF EXISTS "SaaS Isolation Insertion" ON public.%I', tbl_name);
            EXECUTE format('DROP POLICY IF EXISTS "SaaS Isolation Update" ON public.%I', tbl_name);
            EXECUTE format('DROP POLICY IF EXISTS "SaaS Isolation Delete" ON public.%I', tbl_name);

            -- Crear Políitica Global de Aislamiento (Solo ves lo de tu restaurante)
            EXECUTE format('CREATE POLICY "SaaS Isolation Selection" ON public.%I FOR SELECT USING (restaurant_id = public.get_my_restaurant_id())', tbl_name);
            EXECUTE format('CREATE POLICY "SaaS Isolation Insertion" ON public.%I FOR INSERT WITH CHECK (restaurant_id = public.get_my_restaurant_id())', tbl_name);
            EXECUTE format('CREATE POLICY "SaaS Isolation Update" ON public.%I FOR UPDATE USING (restaurant_id = public.get_my_restaurant_id())', tbl_name);
            EXECUTE format('CREATE POLICY "SaaS Isolation Delete" ON public.%I FOR DELETE USING (restaurant_id = public.get_my_restaurant_id())', tbl_name);
        END IF;
    END LOOP;
END $$;

-- 7. Caso especial: Tabla de Restaurantes (Solo Admins globales o lectura propia)
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own restaurant" ON public.restaurants;
CREATE POLICY "Users can view their own restaurant" ON public.restaurants
    FOR SELECT USING (id = public.get_my_restaurant_id());

-- 8. Forzar recarga del esquema
NOTIFY pgrst, 'reload schema';
