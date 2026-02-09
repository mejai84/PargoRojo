
-- =====================================================
-- REPARACIÓN INTEGRAL DE NÓMINA (PAYROLL) Y CAJA
-- Ejecutar este script en el SQL Editor de Supabase
-- =====================================================

-- 1. Asegurar columnas en profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(15,2) DEFAULT 0;

-- 2. Asegurar columnas en shifts
ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS total_hours NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_payment NUMERIC(15,2) DEFAULT 0;

-- 3. Crear tabla de liquidaciones si no existe
CREATE TABLE IF NOT EXISTS public.employee_liquidations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.profiles(id) NOT NULL,
    restaurant_id UUID REFERENCES public.restaurants(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    signature_url TEXT,
    voucher_id UUID,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Actualizar RLS para permitir gestión por parte de Admins
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_liquidations ENABLE ROW LEVEL SECURITY;

-- Política para que Admins puedan cerrar cualquier turno
DROP POLICY IF EXISTS "Admins can update all shifts" ON public.shifts;
CREATE POLICY "Admins can update all shifts" 
ON public.shifts FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
);

-- Política para que el personal vea sus propios turnos
DROP POLICY IF EXISTS "Users view own shifts" ON public.shifts;
CREATE POLICY "Users view own shifts" 
ON public.shifts FOR SELECT 
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- Políticas para Liquidaciones
DROP POLICY IF EXISTS "Admins manage everything in liquidations" ON public.employee_liquidations;
CREATE POLICY "Admins manage everything in liquidations" 
ON public.employee_liquidations FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

DROP POLICY IF EXISTS "Users view own liquidations" ON public.employee_liquidations;
CREATE POLICY "Users view own liquidations" 
ON public.employee_liquidations FOR SELECT 
USING (employee_id = auth.uid());

-- 5. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_shifts_payroll_status ON public.shifts(status);
CREATE INDEX IF NOT EXISTS idx_liquidations_date ON public.employee_liquidations(created_at);
