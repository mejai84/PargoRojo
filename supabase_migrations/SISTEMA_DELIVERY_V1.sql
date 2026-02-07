-- =========================================================
-- SISTEMA DE DOMICILIOS INTEGRADO V1.0
-- Incluye: Rol Driver, Permisos, Tabla de Tracking
-- =========================================================

BEGIN;

-- 1. Habilitar Rol 'driver' en Profiles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
    END IF;
END $$;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'manager', 'cashier', 'waiter', 'cook', 'chef', 'host', 'cleaner', 'driver', 'customer'));


-- 2. Asegurar que table permissions y enum existan (Dependencia)
-- (Asumimos que ya corriste SISTEMA_PERMISOS_GRANULAR_V1)

-- Agregar valores al ENUM si no existen (Postgres no tiene IF NOT EXISTS para valores de enum, así que hacemos un bloque seguro)
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'access_delivery_app';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'manage_deliveries';


-- 3. Asignar Permisos a Roles
-- Driver
INSERT INTO public.user_permissions (user_id, permission)
SELECT id, 'access_delivery_app'::permission_type FROM public.profiles WHERE role = 'driver'
ON CONFLICT DO NOTHING;

-- Manager (si no los tenía)
INSERT INTO public.user_permissions (user_id, permission)
SELECT id, 'manage_deliveries'::permission_type FROM public.profiles WHERE role = 'manager'
ON CONFLICT DO NOTHING;


-- 4. Tabla de Tracking de Domicilios (Ligera y Eficiente)
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
    order_id UUID PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.profiles(id),
    
    status TEXT NOT NULL DEFAULT 'assigned' 
        CHECK (status IN ('assigned', 'picked_up', 'delivered', 'failed')),
    
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    delivery_proof_url TEXT, -- Foto o firma
    notes TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_delivery_driver ON public.delivery_tracking(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status ON public.delivery_tracking(status);

-- RLS
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Drivers can view their deliveries" ON public.delivery_tracking;
CREATE POLICY "Drivers can view their deliveries" ON public.delivery_tracking
    FOR SELECT TO authenticated
    USING ( driver_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'cashier')) );

DROP POLICY IF EXISTS "Drivers can update their deliveries" ON public.delivery_tracking;
CREATE POLICY "Drivers can update their deliveries" ON public.delivery_tracking
    FOR UPDATE TO authenticated
    USING ( driver_id = auth.uid() );

DROP POLICY IF EXISTS "Admins manage deliveries" ON public.delivery_tracking;
CREATE POLICY "Admins manage deliveries" ON public.delivery_tracking
    FOR ALL TO authenticated
    USING ( EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'cashier')) );


COMMIT;

SELECT '✅ Sistema de Domicilios (Driver) habilitado correctamente' as status;
