-- FIX ORDER ITEMS SCHEMA
-- Adding optimizations column to store customizations like product name (for deleted products) or special instructions.

ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS customizations JSONB DEFAULT '{}'::jsonb;
