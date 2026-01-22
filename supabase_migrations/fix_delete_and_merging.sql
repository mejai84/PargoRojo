-- MIGRACIÓN PARA MEJORAR GESTIÓN DE MESAS Y RESERVAS
-- 1. Mejoras en la tabla de mesas
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS parent_table_id UUID REFERENCES public.tables(id);
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS is_merged BOOLEAN DEFAULT false;

-- 2. Asegurar que las políticas RLS permitan eliminar
DROP POLICY IF EXISTS "Personnel can manage tables" ON public.tables;
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

-- 3. Asegurar que las reservas se puedan eliminar
-- Usualmente las reservas no tienen RLS restrictivo para admins, pero vamos a asegurar.
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage reservations" ON public.reservations;
CREATE POLICY "Personnel can manage reservations"
    ON public.reservations FOR ALL
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

-- Permitir que cualquiera cree reservas (público)
DROP POLICY IF EXISTS "Anyone can create reservations" ON public.reservations;
CREATE POLICY "Anyone can create reservations"
    ON public.reservations FOR INSERT
    WITH CHECK (true);

-- Permitir que el personal vea todas
DROP POLICY IF EXISTS "Anyone can view reservations" ON public.reservations;
CREATE POLICY "Anyone can view reservations"
    ON public.reservations FOR SELECT
    USING (true);
