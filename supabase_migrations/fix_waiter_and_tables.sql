-- MIGRACIÓN PARA SEGUIMIENTO DE PERSONAL Y MEJORAS EN MESAS
-- 1. Asegurar campos en la tabla de órdenes
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS waiter_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES public.tables(id);

-- 2. Corregir RLS de mesas (estaba usando metadata de auth.users que suele estar vacía)
-- Usaremos nuestra tabla public.profiles que es la fuente de verdad para roles.
DROP POLICY IF EXISTS "Admins can manage tables" ON public.tables;
DROP POLICY IF EXISTS "Staff can manage tables" ON public.tables;

CREATE POLICY "Personnel can manage tables"
    ON public.tables FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'manager', 'staff', 'cashier')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'manager', 'staff', 'cashier')
        )
    );

-- Permitir que meseros vean las mesas para tomar pedidos
CREATE POLICY "Waiters can view tables"
    ON public.tables FOR SELECT
    TO authenticated
    USING (true);

-- 3. Asegurar que la tabla petty_cash_vouchers tenga la columna category
ALTER TABLE public.petty_cash_vouchers 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Otros';

-- 4. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_orders_waiter_id ON public.orders(waiter_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.orders(table_id);
