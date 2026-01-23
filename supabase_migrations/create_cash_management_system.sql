-- ==========================================
-- SISTEMA DE GESTIÓN DE CAJA (CASH MANAGEMENT)
-- ==========================================

-- 1. Tabla de Turnos de Caja (Shifts)
CREATE TABLE IF NOT EXISTS public.cash_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'auditing')),
    opening_date TIMESTAMPTZ DEFAULT NOW(),
    closing_date TIMESTAMPTZ,
    opening_notes TEXT,
    closing_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Saldos por Turno (Initial and Final amounts per payment method)
CREATE TABLE IF NOT EXISTS public.shift_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID REFERENCES public.cash_shifts(id) ON DELETE CASCADE NOT NULL,
    payment_method TEXT NOT NULL, -- 'cash', 'card', 'transfer', 'qr'
    initial_amount NUMERIC(12,2) DEFAULT 0,
    final_system_amount NUMERIC(12,2) DEFAULT 0, -- Lo que dice el sistema
    final_real_amount NUMERIC(12,2) DEFAULT 0,   -- Lo que contó el cajero (en el arqueo)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Movimientos de Caja (Detailed ledger)
CREATE TABLE IF NOT EXISTS public.cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID REFERENCES public.cash_shifts(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('sale', 'income', 'expense', 'opening', 'closing')),
    amount NUMERIC(12,2) NOT NULL,
    payment_method TEXT NOT NULL, 
    reason TEXT,
    reference_id UUID, -- Opcional: ID de la orden vinculada si es una venta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Indices para rendimiento
CREATE INDEX IF NOT EXISTS idx_cash_shifts_user ON public.cash_shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_shifts_status ON public.cash_shifts(status);
CREATE INDEX IF NOT EXISTS idx_cash_movements_shift ON public.cash_movements(shift_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_type ON public.cash_movements(type);

-- RLS (Seguridad)
ALTER TABLE public.cash_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (Admins ven todo, cajeros ven lo suyo)
CREATE POLICY "Admins can view all shifts" ON public.cash_shifts 
FOR SELECT USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Users can view their own shifts" ON public.cash_shifts 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all balances" ON public.shift_balances 
FOR SELECT USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can view all movements" ON public.cash_movements 
FOR SELECT USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cash_shifts_updated_at
BEFORE UPDATE ON public.cash_shifts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE cash_shifts IS 'Sesiones de caja por usuario y turno';
COMMENT ON TABLE cash_movements IS 'Registro detallado de entradas y salidas de dinero';
