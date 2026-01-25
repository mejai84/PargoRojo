-- FIX RLS Production - Pargo Rojo
-- Fecha: 25 de enero de 2026

-- 1. Shifts policies
DROP POLICY IF EXISTS "Staff can view shifts" ON public.shifts;
DROP POLICY IF EXISTS "Cashiers can manage shifts" ON public.shifts;
DROP POLICY IF EXISTS "Cashiers can update own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Anyone authenticated can view shifts" ON public.shifts;
DROP POLICY IF EXISTS "Users can manage own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Users can update own shifts" ON public.shifts;

CREATE POLICY "Anyone authenticated can view shifts" 
ON public.shifts FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own shifts" 
ON public.shifts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shifts" 
ON public.shifts FOR UPDATE 
USING (auth.uid() = user_id);

-- 2. Cashboxes policies
DROP POLICY IF EXISTS "Staff can view cashboxes" ON public.cashboxes;
DROP POLICY IF EXISTS "Authenticated users can view cashboxes" ON public.cashboxes;
DROP POLICY IF EXISTS "Admins can modify cashboxes" ON public.cashboxes;

CREATE POLICY "Authenticated users can view cashboxes" 
ON public.cashboxes FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can modify cashboxes"
ON public.cashboxes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner', 'cashier')
    )
);

-- 3. Cashbox sessions policies
DROP POLICY IF EXISTS "Staff can view sessions" ON public.cashbox_sessions;
DROP POLICY IF EXISTS "Cashiers can open sessions" ON public.cashbox_sessions;
DROP POLICY IF EXISTS "Cashiers can close sessions" ON public.cashbox_sessions;
DROP POLICY IF EXISTS "Users can view their sessions" ON public.cashbox_sessions;
DROP POLICY IF EXISTS "Staff can open sessions" ON public.cashbox_sessions;
DROP POLICY IF EXISTS "Users can close their sessions" ON public.cashbox_sessions;

CREATE POLICY "Users can view their sessions" 
ON public.cashbox_sessions FOR SELECT 
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner')
    )
);

CREATE POLICY "Staff can open sessions" 
ON public.cashbox_sessions FOR INSERT 
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner', 'cashier', 'waiter')
    )
);

CREATE POLICY "Users can close their sessions" 
ON public.cashbox_sessions FOR UPDATE 
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner')
    )
);

-- 4. Cash movements policies
DROP POLICY IF EXISTS "System/Cashiers can insert movements" ON public.cash_movements;
DROP POLICY IF EXISTS "Read only movements" ON public.cash_movements;
DROP POLICY IF EXISTS "Staff can insert movements" ON public.cash_movements;
DROP POLICY IF EXISTS "Users can view their movements" ON public.cash_movements;

CREATE POLICY "Staff can insert movements" 
ON public.cash_movements FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner', 'cashier', 'waiter')
    )
);

CREATE POLICY "Users can view their movements" 
ON public.cash_movements FOR SELECT 
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner')
    )
);

-- 5. Delivery drivers policies
DROP POLICY IF EXISTS "Drivers can view own record" ON public.delivery_drivers;
DROP POLICY IF EXISTS "Admin can view all drivers" ON public.delivery_drivers;
DROP POLICY IF EXISTS "Admins can insert drivers" ON public.delivery_drivers;
DROP POLICY IF EXISTS "Admins can update drivers" ON public.delivery_drivers;
DROP POLICY IF EXISTS "Admins can delete drivers" ON public.delivery_drivers;
DROP POLICY IF EXISTS "Admin can manage drivers" ON public.delivery_drivers;
DROP POLICY IF EXISTS "Authenticated can view drivers" ON public.delivery_drivers;

CREATE POLICY "Admin can manage drivers" 
ON public.delivery_drivers FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner')
    )
);

CREATE POLICY "Authenticated can view drivers" 
ON public.delivery_drivers FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 6. Orders policies
DROP POLICY IF EXISTS "Users can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can manage orders" ON public.orders;

CREATE POLICY "Authenticated users can view all orders"
ON public.orders FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage orders"
ON public.orders FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner', 'cashier', 'waiter', 'kitchen')
    )
);

-- 7. Skip delivery_config (table may not exist)

-- 8. Ensure Caja Principal exists
INSERT INTO public.cashboxes (name, current_status)
SELECT 'Caja Principal', 'CLOSED'
WHERE NOT EXISTS (
    SELECT 1 FROM public.cashboxes WHERE name = 'Caja Principal'
);

-- 9. Create cashbox_audits table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cashbox_audits') THEN
        CREATE TABLE public.cashbox_audits (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            cashbox_session_id UUID REFERENCES public.cashbox_sessions(id),
            user_id UUID REFERENCES public.profiles(id),
            counted_amount NUMERIC(12,2),
            system_amount NUMERIC(12,2),
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE public.cashbox_audits ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DROP POLICY IF EXISTS "Users can manage audits" ON public.cashbox_audits;
CREATE POLICY "Users can manage audits" 
ON public.cashbox_audits FOR ALL 
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner')
    )
);

-- 10. Fix petty_cash_vouchers accounting_code column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'petty_cash_vouchers' AND column_name = 'accounting_code') THEN
        ALTER TABLE public.petty_cash_vouchers ADD COLUMN accounting_code VARCHAR(100);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'petty_cash_vouchers' AND column_name = 'status') THEN
        ALTER TABLE public.petty_cash_vouchers ADD COLUMN status VARCHAR(20) DEFAULT 'draft';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'petty_cash_vouchers' AND column_name = 'category') THEN
        ALTER TABLE public.petty_cash_vouchers ADD COLUMN category TEXT DEFAULT 'Otros';
    END IF;
END $$;

DROP POLICY IF EXISTS "Admins manage petty cash" ON public.petty_cash_vouchers;
DROP POLICY IF EXISTS "Cashiers manage petty cash" ON public.petty_cash_vouchers;
DROP POLICY IF EXISTS "Staff manage petty cash" ON public.petty_cash_vouchers;

CREATE POLICY "Staff manage petty cash" ON public.petty_cash_vouchers 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner', 'cashier', 'manager'))
);

-- 11. Add address field to profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
        ALTER TABLE public.profiles ADD COLUMN address TEXT;
    END IF;
END $$;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

-- 12. Delivery settings table and policies
CREATE TABLE IF NOT EXISTS public.delivery_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_fee_enabled BOOLEAN DEFAULT false,
    delivery_fee NUMERIC(10,2) DEFAULT 0,
    free_delivery_threshold NUMERIC(10,2),
    max_delivery_radius_km NUMERIC(5,2) DEFAULT 5,
    estimated_delivery_time_min INTEGER DEFAULT 30,
    estimated_delivery_time_max INTEGER DEFAULT 45,
    restaurant_address TEXT,
    restaurant_lat NUMERIC,
    restaurant_lng NUMERIC,
    restaurant_phone TEXT,
    delivery_active BOOLEAN DEFAULT true,
    pickup_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view delivery settings" ON public.delivery_settings;
DROP POLICY IF EXISTS "Admin can update delivery settings" ON public.delivery_settings;
DROP POLICY IF EXISTS "Admin can manage delivery settings" ON public.delivery_settings;

CREATE POLICY "Anyone can view delivery settings" 
ON public.delivery_settings FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage delivery settings" 
ON public.delivery_settings FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner')
    )
);

INSERT INTO public.delivery_settings (
    delivery_fee_enabled, 
    delivery_fee, 
    max_delivery_radius_km,
    delivery_active,
    pickup_active
)
SELECT 
    false, 
    5000, 
    5,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.delivery_settings);

-- 13. Delivery drivers table
CREATE TABLE IF NOT EXISTS public.delivery_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    full_name TEXT NOT NULL,
    phone TEXT,
    vehicle_type TEXT DEFAULT 'motorcycle',
    license_plate TEXT,
    is_active BOOLEAN DEFAULT true,
    rating NUMERIC(3,2) DEFAULT 5.00,
    total_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
-- FIX Tables RLS - Para que las mesas se puedan crear/editar/eliminar

-- Habilitar RLS
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- Eliminar polÃ­ticas anteriores
DROP POLICY IF EXISTS "Anyone can view tables" ON public.tables;
DROP POLICY IF EXISTS "Staff can manage tables" ON public.tables;
DROP POLICY IF EXISTS "Authenticated users can view tables" ON public.tables;
DROP POLICY IF EXISTS "Admins can manage tables" ON public.tables;

-- Nuevas polÃ­ticas permisivas
CREATE POLICY "Anyone can view tables" 
ON public.tables FOR SELECT 
USING (true);

CREATE POLICY "Staff can manage tables" 
ON public.tables FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner', 'waiter', 'cashier')
    )
);

-- Force reload
NOTIFY pgrst, 'reload schema';
-- Storage Bucket for Payment Proofs

-- Enable storage extension if not enabled (usually enabled by default)

-- Create bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment_proofs', 'payment_proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Policies
CREATE POLICY "Public Access Payment Proofs" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'payment_proofs');

CREATE POLICY "Upload Payment Proofs" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'payment_proofs');

CREATE POLICY "Update Payment Proofs" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'payment_proofs');
