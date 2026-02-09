
-- REPARACIÓN DE ESQUEMA PARA NÓMINA Y LIQUIDACIÓN
-- Añade columnas faltantes requeridas por el módulo de Payroll y crea la tabla de liquidaciones.

-- 1. Asegurar que los perfiles tengan salario por hora
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(15,2) DEFAULT 0;

-- 2. Asegurar que los turnos tengan columnas de cálculo financiero
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

-- 4. RLS para Liquidaciones
ALTER TABLE public.employee_liquidations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage everything in liquidations" 
ON public.employee_liquidations FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

CREATE POLICY "Users view own liquidations" 
ON public.employee_liquidations FOR SELECT 
USING (employee_id = auth.uid());

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_liquidations_employee ON public.employee_liquidations(employee_id);
CREATE INDEX IF NOT EXISTS idx_liquidations_restaurant ON public.employee_liquidations(restaurant_id);
