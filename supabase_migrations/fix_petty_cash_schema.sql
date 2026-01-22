-- Fix Petty Cash Schema and Permissions

-- 1. Ensure 'status' column exists (it should, but just in case)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'petty_cash_vouchers' AND column_name = 'status') THEN
        ALTER TABLE public.petty_cash_vouchers ADD COLUMN status VARCHAR(20) DEFAULT 'draft';
    END IF;
END $$;

-- 2. Add 'category' column (it was missing in original migration)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'petty_cash_vouchers' AND column_name = 'category') THEN
        ALTER TABLE public.petty_cash_vouchers ADD COLUMN category TEXT DEFAULT 'Otros';
    END IF;
END $$;

-- 3. Ensure permissions are correct
ALTER TABLE public.petty_cash_vouchers ENABLE ROW LEVEL SECURITY;

-- Drop old policies to be safe
DROP POLICY IF EXISTS "Admins manage petty cash" ON public.petty_cash_vouchers;
DROP POLICY IF EXISTS "Cashiers manage petty cash" ON public.petty_cash_vouchers;

-- Create comprehensive policy for Admins and Cashiers
CREATE POLICY "Admins manage petty cash" ON public.petty_cash_vouchers 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Cashiers manage petty cash" ON public.petty_cash_vouchers 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'cashier')
);

-- Force schema cache reload (by doing a dummy notify or just DDL is enough usually)
NOTIFY pgrst, 'reload schema';
