-- FIX RLS POLICIES FOR ORDERS AND CHECKOUT
-- This script permits users (and guests) to create orders and order items.

-- 1. ORDERS TABLE
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE (authenticated or anon) to create an order
-- This is necessary for the checkout flow to work for both guests and users.
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.orders;
CREATE POLICY "Enable insert for everyone" ON public.orders FOR INSERT WITH CHECK (true);

-- Allow Users to view their own orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

-- Allow Admins to do everything
DROP POLICY IF EXISTS "Admins have full access" ON public.orders;
CREATE POLICY "Admins have full access" ON public.orders FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')
  )
);

-- 2. ORDER ITEMS TABLE
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE to insert order items (linked to the order they just made)
DROP POLICY IF EXISTS "Enable insert for order items" ON public.order_items;
CREATE POLICY "Enable insert for order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Allow Users to view their own order items
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  )
);

-- Allow Admins to see items
DROP POLICY IF EXISTS "Admins have full access items" ON public.order_items;
CREATE POLICY "Admins have full access items" ON public.order_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')
  )
);
