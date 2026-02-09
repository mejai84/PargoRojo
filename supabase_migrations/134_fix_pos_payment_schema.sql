-- REPARACIÓN DE ESQUEMA POS / PAGOS
-- Añade columnas faltantes requeridas por el RPC de pagos atómicos.

-- 1. Asegurar payment_method en cash_movements
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cash_movements' AND column_name = 'payment_method') THEN
        ALTER TABLE public.cash_movements ADD COLUMN payment_method TEXT;
    END IF;
END $$;

-- 2. Asegurar tip_amount en orders (por si acaso)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'tip_amount') THEN
        ALTER TABLE public.orders ADD COLUMN tip_amount DECIMAL(12,2) DEFAULT 0;
    END IF;
END $$;

-- 3. Recargar PostgREST
NOTIFY pgrst, 'reload schema';
