-- Add all missing columns to orders table to support checkout flow fully
-- Executing this multiple times is safe (IF NOT EXISTS)

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'delivery',
ADD COLUMN IF NOT EXISTS delivery_address JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS guest_info JSONB DEFAULT NULL;

-- Ensure RLS allows insertion of these fields
-- This is usually automatic for owners but if public insert is allowed check policies.
