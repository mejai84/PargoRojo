-- Reparación de columnas faltantes en petty_cash_vouchers
-- Este script asegura que todas las columnas requeridas por el frontend existan.

DO $$ 
BEGIN
    -- 1. amount_in_words
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'petty_cash_vouchers' AND column_name = 'amount_in_words') THEN
        ALTER TABLE public.petty_cash_vouchers ADD COLUMN amount_in_words TEXT;
    END IF;

    -- 2. category (por si acaso, aunque fix_petty_cash_schema ya lo tenía)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'petty_cash_vouchers' AND column_name = 'category') THEN
        ALTER TABLE public.petty_cash_vouchers ADD COLUMN category TEXT DEFAULT 'Otros';
    END IF;

    -- 3. status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'petty_cash_vouchers' AND column_name = 'status') THEN
        ALTER TABLE public.petty_cash_vouchers ADD COLUMN status VARCHAR(20) DEFAULT 'draft';
    END IF;

    -- 4. signature_data (asegurar que sea TEXT para base64)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'petty_cash_vouchers' AND column_name = 'signature_data') THEN
        ALTER TABLE public.petty_cash_vouchers ADD COLUMN signature_data TEXT;
    END IF;

    -- 5. accounting_code
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'petty_cash_vouchers' AND column_name = 'accounting_code') THEN
        ALTER TABLE public.petty_cash_vouchers ADD COLUMN accounting_code TEXT DEFAULT '5105';
    END IF;

    -- 6. cargo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'petty_cash_vouchers' AND column_name = 'cargo') THEN
        ALTER TABLE public.petty_cash_vouchers ADD COLUMN cargo TEXT;
    END IF;

    -- 7. restaurant_id (Crítico para RLS)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'petty_cash_vouchers' AND column_name = 'restaurant_id') THEN
        ALTER TABLE public.petty_cash_vouchers ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id) DEFAULT '00000000-0000-0000-0000-000000000000';
    END IF;
END $$;

-- Asegurar permisos para el rol de cajero también
DROP POLICY IF EXISTS "Cashiers manage petty cash" ON public.petty_cash_vouchers;
CREATE POLICY "Cashiers manage petty cash" ON public.petty_cash_vouchers 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'cashier')
);

-- Recargar caché de PostgREST
NOTIFY pgrst, 'reload schema';
