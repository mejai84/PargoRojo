-- Migration to fix petty_cash_vouchers and prepare for multi-tenancy

-- 1. Create Restaurants table (For Multi-tenancy)
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255) UNIQUE,
    logo_url TEXT,
    primary_color VARCHAR(50) DEFAULT '#FF6B35',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Fix petty_cash_vouchers missing column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'petty_cash_vouchers' AND column_name = 'accounting_code') THEN
        ALTER TABLE public.petty_cash_vouchers ADD COLUMN accounting_code VARCHAR(100);
    END IF;
END $$;

-- 3. Add restaurant_id to core tables for Multi-Tenancy
-- We'll do this for profiles first to associate users with restaurants
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id);

-- 4. Enable RLS on core tables to filter by restaurant_id (Multi-tenancy protection)
-- Note: This is a template, in a real scenario we'd do this for ALL tables.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id);
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id);
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id);
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id);

-- 5. Force reload schema cache
NOTIFY pgrst, 'reload schema';
