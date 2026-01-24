-- PASO 1: CREACIÓN DE TABLAS Y ESTRUCTURA
-- Ejecutar este script primero

-- Tabla de permisos
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de roles
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla intermedia roles-permisos
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- Actualizar profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);

-- Tabla de configuración de delivery
CREATE TABLE IF NOT EXISTS public.delivery_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_fee_enabled BOOLEAN DEFAULT TRUE,
    delivery_fee NUMERIC DEFAULT 5000,
    free_delivery_threshold NUMERIC DEFAULT NULL,
    max_delivery_radius_km NUMERIC DEFAULT 3,
    estimated_delivery_time_min INTEGER DEFAULT 30,
    estimated_delivery_time_max INTEGER DEFAULT 45,
    restaurant_address TEXT,
    restaurant_lat NUMERIC,
    restaurant_lng NUMERIC,
    restaurant_phone TEXT,
    business_hours JSONB DEFAULT '[]'::jsonb,
    delivery_active BOOLEAN DEFAULT TRUE,
    pickup_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id)
);

-- Tabla de repartidores
CREATE TABLE IF NOT EXISTS public.delivery_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    vehicle_type TEXT,
    license_plate TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    current_location_lat NUMERIC,
    current_location_lng NUMERIC,
    location_updated_at TIMESTAMPTZ,
    total_deliveries INTEGER DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 5.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de asignaciones de delivery
CREATE TABLE IF NOT EXISTS public.order_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
    driver_id UUID REFERENCES public.delivery_drivers(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,
    assigned_by UUID REFERENCES public.profiles(id),
    picked_up_at TIMESTAMPTZ,
    on_route_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    delivery_status TEXT DEFAULT 'pending' CHECK (
        delivery_status IN ('pending', 'assigned', 'picked_up', 'on_route', 'delivered', 'failed', 'cancelled')
    ),
    delivery_address JSONB,
    customer_phone TEXT,
    delivery_notes TEXT,
    customer_location_lat NUMERIC,
    customer_location_lng NUMERIC,
    distance_km NUMERIC,
    estimated_arrival TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    proof_of_delivery JSONB,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices delivery
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_active ON public.delivery_drivers(is_active, is_available);
CREATE INDEX IF NOT EXISTS idx_order_deliveries_status ON public.order_deliveries(delivery_status);
CREATE INDEX IF NOT EXISTS idx_order_deliveries_driver ON public.order_deliveries(driver_id, delivery_status);

-- Auditoría
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de actualización
DROP TRIGGER IF EXISTS update_delivery_settings_updated_at ON public.delivery_settings;
CREATE TRIGGER update_delivery_settings_updated_at BEFORE UPDATE ON public.delivery_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_drivers_updated_at ON public.delivery_drivers;
CREATE TRIGGER update_delivery_drivers_updated_at BEFORE UPDATE ON public.delivery_drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_deliveries_updated_at ON public.order_deliveries;
CREATE TRIGGER update_order_deliveries_updated_at BEFORE UPDATE ON public.order_deliveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
