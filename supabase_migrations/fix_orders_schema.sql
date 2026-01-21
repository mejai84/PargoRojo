-- Add missing columns to orders table to support checkout flow
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_address JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update RLS if necessary (optional, assuming existing policies cover updates)
-- Uncomment if you need to allow public inserts/updates based on these new columns explicitly, 
-- though usually row-level policies are on the table, not columns.
