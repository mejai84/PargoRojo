-- SISTEMA DE NÓMINA, LIQUIDACIÓN Y CAJA MENOR
-- Este script crea las tablas necesarias para gestionar turnos, pagos de empleados y caja menor.

-- 1. TURNOS (SHIFTS)
-- Para registrar entrada y salida de trabajadores
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES profiles(id) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    total_hours DECIMAL(10,2),
    hourly_rate DECIMAL(15,2) DEFAULT 0,
    total_payment DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'paid'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LIQUIDACIONES (EMPLEADOS)
-- Para el cierre de periodos de pago
CREATE TABLE IF NOT EXISTS employee_liquidations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES profiles(id) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    signature_url TEXT, -- URL de la firma digital (base64 o storage)
    voucher_id UUID, -- Relación con el comprobante de caja menor si aplica
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COMPROBANTES DE CAJA MENOR (PETTY CASH)
-- Basado en el formato de la imagen proporcionada
CREATE TABLE IF NOT EXISTS petty_cash_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_number SERIAL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    requested_by UUID REFERENCES profiles(id), -- Quien solicita el dinero
    beneficiary_name TEXT NOT NULL, -- Nombre de quien recibe (puede ser externo o el mismo empleado)
    cargo TEXT, -- Cargo de quien solicita
    amount DECIMAL(15,2) NOT NULL,
    amount_in_words TEXT,
    concept TEXT NOT NULL, -- Motivo del gasto
    is_payroll_payment BOOLEAN DEFAULT false, -- Si es para pago de nómina
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'approved', 'paid', 'void'
    signature_data TEXT, -- Firma en formato SVG o Base64
    accounting_code TEXT DEFAULT '5105', -- Código contable (ej: Gastos de personal)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS POLICIES
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_liquidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE petty_cash_vouchers ENABLE ROW LEVEL SECURITY;

-- Admins y Managers pueden gestionar todo
CREATE POLICY "Admins manage payroll" ON shifts FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins manage liquidations" ON employee_liquidations FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins manage petty cash" ON petty_cash_vouchers FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Empleados pueden ver sus propios datos
CREATE POLICY "Employees view own shifts" ON shifts FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "Employees view own liquidations" ON employee_liquidations FOR SELECT USING (employee_id = auth.uid());

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_shifts_employee ON shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_date ON petty_cash_vouchers(date);
CREATE INDEX IF NOT EXISTS idx_liquidations_employee ON employee_liquidations(employee_id);

-- 5. AGREGAR CONFIGURACIÓN DE MÓDULOS A SETTINGS
-- Esto permite habilitar/deshabilitar módulos desde el panel de settings
INSERT INTO public.settings (key, value, description)
VALUES 
    ('module_access', 
    '{
        "tables": ["admin", "staff", "waiter"],
        "payroll": ["admin"],
        "petty_cash": ["admin", "cashier"],
        "inventory": ["admin", "cook"],
        "reports": ["admin"],
        "kitchen": ["admin", "cook", "staff"]
    }'::jsonb, 
    'Map of role access per module')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
