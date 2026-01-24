-- =============================================
-- ESQUEMA MOTOR POS (POS ENGINE) V1.0
-- Módulo de Caja, Turnos y Control Financiero Estricto
-- =============================================

-- 0. CLIENTES (CUSTOMERS) - Requerido para ventas
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_id TEXT, -- NIT / Cédula
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. DISPOSITIVOS (Para control de sesiones físicas)
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    fingerprint TEXT UNIQUE, -- Identificador único del navegador/app
    last_ip TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TURNOS (SHIFTS) - Jornada laboral
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    device_id UUID REFERENCES public.devices(id),
    shift_type TEXT CHECK (shift_type IN ('MORNING', 'AFTERNOON', 'NIGHT', 'CUSTOM')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas de turno activo
CREATE INDEX IF NOT EXISTS idx_shifts_active ON public.shifts(user_id) WHERE status = 'OPEN';

-- 3. CAJAS FÍSICAS (CASHBOXES)
CREATE TABLE IF NOT EXISTS public.cashboxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- Ej: 'Caja Principal', 'Caja Barra'
    current_status TEXT DEFAULT 'CLOSED' CHECK (current_status IN ('OPEN', 'CLOSED', 'BLOCKED')),
    assigned_user_id UUID REFERENCES public.profiles(id), -- Usuario que la tiene asignada actualmente
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar caja por defecto si no existe
INSERT INTO public.cashboxes (name) 
SELECT 'Caja Principal' WHERE NOT EXISTS (SELECT 1 FROM public.cashboxes);

-- 4. SESIONES DE CAJA (Apertura y Cierre)
CREATE TABLE IF NOT EXISTS public.cashbox_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashbox_id UUID REFERENCES public.cashboxes(id) NOT NULL,
    shift_id UUID REFERENCES public.shifts(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    
    -- Valores de Apertura
    opening_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    opening_time TIMESTAMPTZ DEFAULT NOW(),
    opening_notes TEXT,
    
    -- Valores de Cierre
    closing_amount NUMERIC(12,2), -- Lo que contó el cajero
    system_amount NUMERIC(12,2), -- Lo que dice el sistema que debería haber
    difference_amount NUMERIC(12,2) GENERATED ALWAYS AS (closing_amount - system_amount) STORED,
    closing_time TIMESTAMPTZ,
    closing_notes TEXT,
    
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'ARCHIVED')),
    
    -- Auditoría interna
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regla de unicidad: Una caja solo puede tener una sesión abierta a la vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_session_per_box 
ON public.cashbox_sessions (cashbox_id) WHERE status = 'OPEN';

-- 5. MOVIMIENTOS DE CAJA (Entradas y Salidas de dinero)
CREATE TABLE IF NOT EXISTS public.cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashbox_session_id UUID REFERENCES public.cashbox_sessions(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    
    movement_type TEXT NOT NULL CHECK (movement_type IN ('SALE', 'REFUND', 'DEPOSIT', 'WITHDRAWAL', 'OPENING')),
    amount NUMERIC(12,2) NOT NULL,
    description TEXT,
    reference_id UUID, -- ID de venta u otro documento
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. VENTAS POS (Transacciones financieras estrictas)
-- Nota: Esto puede vincularse o reemplazar parcialmente a 'orders' para temas fiscales/caja
CREATE TABLE IF NOT EXISTS public.pos_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashbox_session_id UUID REFERENCES public.cashbox_sessions(id) NOT NULL,
    shift_id UUID REFERENCES public.shifts(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    order_id UUID REFERENCES public.orders(id), -- Vínculo con la orden operativa (comanda)
    customer_id UUID REFERENCES public.customers(id),
    
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIAL', 'REFUNDED', 'VOIDED')),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PAGOS (Desglose de métodos de pago)
CREATE TABLE IF NOT EXISTS public.sale_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES public.pos_sales(id) NOT NULL,
    cashbox_session_id UUID REFERENCES public.cashbox_sessions(id) NOT NULL,
    
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER', 'QR', 'CREDIT')),
    amount NUMERIC(12,2) NOT NULL,
    reference_code TEXT, -- Nro de voucher, transacción, etc.
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SEGURIDAD (RLS)
-- =============================================

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashbox_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;

-- Políticas Base (Lectura para staff autorizado)
CREATE POLICY "Staff can view shifts" ON public.shifts FOR SELECT USING (true);
CREATE POLICY "Staff can view cashboxes" ON public.cashboxes FOR SELECT USING (true);
CREATE POLICY "Staff can view sessions" ON public.cashbox_sessions FOR SELECT 
    USING (public.user_has_permission(auth.uid(), 'VIEW_REPORTS') OR user_id = auth.uid());

-- Políticas de Operación (Solo quien tiene turno/permiso)
CREATE POLICY "Cashiers can manage shifts" ON public.shifts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Cashiers can update own shifts" ON public.shifts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Cashiers can open sessions" ON public.cashbox_sessions FOR INSERT
    WITH CHECK (public.user_has_permission(auth.uid(), 'open_cash'));

CREATE POLICY "Cashiers can close sessions" ON public.cashbox_sessions FOR UPDATE
    USING (public.user_has_permission(auth.uid(), 'close_cash'));

-- Políticas de Movimientos (Solo inserción, inmutables)
CREATE POLICY "System/Cashiers can insert movements" ON public.cash_movements FOR INSERT
    WITH CHECK (
        public.user_has_permission(auth.uid(), 'sell') OR 
        public.user_has_permission(auth.uid(), 'open_cash')
    );
    
CREATE POLICY "Read only movements" ON public.cash_movements FOR SELECT
    USING (public.user_has_permission(auth.uid(), 'VIEW_REPORTS') OR user_id = auth.uid());

-- =============================================
-- TRIGGERS Y FUNCIONES DE CONTROL
-- =============================================

-- A. Función para actualizar estado de caja al abrir/cerrar sesión
CREATE OR REPLACE FUNCTION sync_cashbox_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'OPEN' THEN
        UPDATE public.cashboxes SET current_status = 'OPEN', assigned_user_id = NEW.user_id WHERE id = NEW.cashbox_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.status IN ('CLOSED', 'ARCHIVED') THEN
        UPDATE public.cashboxes SET current_status = 'CLOSED', assigned_user_id = NULL WHERE id = NEW.cashbox_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_cashbox_status
AFTER INSERT OR UPDATE ON public.cashbox_sessions
FOR EACH ROW EXECUTE FUNCTION sync_cashbox_status();


-- B. Función de Auditoría Automática para Operaciones de Caja
CREATE OR REPLACE FUNCTION audit_cash_operations()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id, action, entity_type, entity_id, old_values, new_values
    ) VALUES (
        auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_shift_changes AFTER UPDATE ON public.shifts
FOR EACH ROW EXECUTE FUNCTION audit_cash_operations();

CREATE TRIGGER audit_session_changes AFTER UPDATE ON public.cashbox_sessions
FOR EACH ROW EXECUTE FUNCTION audit_cash_operations();

