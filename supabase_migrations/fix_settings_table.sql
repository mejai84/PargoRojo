-- FIX SETTINGS TABLE SCHEMA
-- This script ensures the settings table has the description column and inserts the default configuration.

-- 1. Ensure description column exists
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Insert or Update default settings
INSERT INTO public.settings (key, value, description)
VALUES ('feature_flags', '{
    "enable_kitchen_kds": true,
    "enable_waiter_pos": true,
    "enable_reservations": true,
    "enable_coupons": true,
    "require_cashier_approval": true
}'::jsonb, 'Global system flags')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, description = EXCLUDED.description;
