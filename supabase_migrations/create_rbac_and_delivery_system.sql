-- =============================================
-- RBAC (Role-Based Access Control) + DELIVERY SYSTEM
-- Sistema completo de permisos por rol y gestión de delivery
-- =============================================

-- =============================================
-- PARTE 1: SISTEMA DE PERMISOS (RBAC)
-- =============================================

-- Tabla de permisos disponibles en el sistema
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT, -- 'settings', 'orders', 'users', 'delivery', 'reports'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de roles con permisos asociados
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE, -- Roles del sistema no se pueden eliminar
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relación muchos a muchos: roles - permisos
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- Actualizar la tabla profiles para usar roles UUID en lugar de texto simple
-- (Mantenemos compatibilidad con role TEXT existente)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);

-- Crear índices para optimizar consultas de permisos
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);

-- =============================================
-- PARTE 2: CONFIGURACIÓN DE DELIVERY
-- =============================================

-- Tabla de configuración global del sistema de delivery
CREATE TABLE IF NOT EXISTS public.delivery_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_fee_enabled BOOLEAN DEFAULT TRUE,
    delivery_fee NUMERIC DEFAULT 5000, -- En centavos de moneda local
    free_delivery_threshold NUMERIC DEFAULT NULL, -- Pedido mínimo para envío gratis
    max_delivery_radius_km NUMERIC DEFAULT 3, -- Radio máximo de entrega en km
    estimated_delivery_time_min INTEGER DEFAULT 30, -- Tiempo estimado mínimo
    estimated_delivery_time_max INTEGER DEFAULT 45, -- Tiempo estimado máximo
    restaurant_address TEXT, -- Dirección del restaurante
    restaurant_lat NUMERIC, -- Latitud del restaurante
    restaurant_lng NUMERIC, -- Longitud del restaurante
    restaurant_phone TEXT,
    business_hours JSONB DEFAULT '[]'::jsonb, -- Horarios de atención
    delivery_active BOOLEAN DEFAULT TRUE, -- Activar/desactivar delivery globalmente
    pickup_active BOOLEAN DEFAULT TRUE, -- Activar/desactivar pickup globalmente
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id)
);

-- Insertar configuración inicial si no existe
INSERT INTO public.delivery_settings (
    delivery_fee_enabled,
    delivery_fee,
    max_delivery_radius_km,
    restaurant_address,
    restaurant_phone
) 
SELECT TRUE, 5000, 3, 'Calle Principal #123, Barrio Centro', '+57 300 123 4567'
WHERE NOT EXISTS (SELECT 1 FROM public.delivery_settings);

-- =============================================
-- PARTE 3: GESTIÓN DE REPARTIDORES
-- =============================================

-- Tabla de repartidores (delivery drivers)
CREATE TABLE IF NOT EXISTS public.delivery_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    vehicle_type TEXT, -- 'bike', 'motorcycle', 'car', 'foot'
    license_plate TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE, -- Disponible para asignaciones
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
    picked_up_at TIMESTAMPTZ, -- Cuando el repartidor recoge el pedido
    on_route_at TIMESTAMPTZ, -- Cuando está en camino
    delivered_at TIMESTAMPTZ, -- Cuando se entrega
    delivery_status TEXT DEFAULT 'pending' CHECK (
        delivery_status IN ('pending', 'assigned', 'picked_up', 'on_route', 'delivered', 'failed', 'cancelled')
    ),
    delivery_address JSONB, -- Dirección de entrega
    customer_phone TEXT,
    delivery_notes TEXT,
    customer_location_lat NUMERIC,
    customer_location_lng NUMERIC,
    distance_km NUMERIC,
    estimated_arrival TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    proof_of_delivery JSONB, -- Fotos, firma digital, etc.
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas de delivery
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_active ON public.delivery_drivers(is_active, is_available);
CREATE INDEX IF NOT EXISTS idx_order_deliveries_status ON public.order_deliveries(delivery_status);
CREATE INDEX IF NOT EXISTS idx_order_deliveries_driver ON public.order_deliveries(driver_id, delivery_status);

-- =============================================
-- PARTE 4: LOGS DE AUDITORÍA
-- =============================================

-- Tabla de auditoría para cambios críticos
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    entity_type TEXT NOT NULL, -- 'delivery_settings', 'order', 'user', etc.
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- =============================================
-- PARTE 5: INSERTAR PERMISOS Y ROLES INICIALES
-- =============================================

-- Insertar permisos del sistema
INSERT INTO public.permissions (name, description, category) VALUES
-- Settings
('MANAGE_SETTINGS', 'Gestionar configuración del negocio', 'settings'),
('VIEW_SETTINGS', 'Ver configuración del negocio', 'settings'),
('MANAGE_DELIVERY_CONFIG', 'Gestionar configuración de delivery', 'settings'),

-- Users
('MANAGE_USERS', 'Crear, editar y eliminar usuarios', 'users'),
('VIEW_USERS', 'Ver lista de usuarios', 'users'),
('MANAGE_ROLES', 'Gestionar roles y permisos', 'users'),

-- Orders
('CREATE_ORDER', 'Crear pedidos', 'orders'),
('VIEW_ALL_ORDERS', 'Ver todos los pedidos', 'orders'),
('VIEW_OWN_ORDERS', 'Ver solo pedidos propios', 'orders'),
('UPDATE_ORDER_STATUS', 'Actualizar estado de pedidos', 'orders'),
('CANCEL_ORDER', 'Cancelar pedidos', 'orders'),

-- Delivery
('ASSIGN_DELIVERY', 'Asignar repartidor a pedidos', 'delivery'),
('MANAGE_DRIVERS', 'Gestionar repartidores', 'delivery'),
('VIEW_DELIVERIES', 'Ver deliveries asignados', 'delivery'),
('UPDATE_DELIVERY_STATUS', 'Actualizar estado de delivery', 'delivery'),

-- Reports
('VIEW_REPORTS', 'Ver reportes generales', 'reports'),
('VIEW_FINANCIAL_REPORTS', 'Ver reportes financieros', 'reports'),
('EXPORT_DATA', 'Exportar datos', 'reports')
ON CONFLICT (name) DO NOTHING;

-- Insertar roles del sistema
INSERT INTO public.roles (name, description, is_system_role) VALUES
('admin', 'Administrador con acceso total', TRUE),
('supervisor', 'Supervisor con acceso limitado a configuración', TRUE),
('cashier', 'Cajero con acceso a ventas', TRUE),
('driver', 'Repartidor con acceso a sus deliveries', TRUE),
('waiter', 'Mesero con acceso al portal de mesas', TRUE),
('kitchen', 'Personal de cocina', TRUE),
('user', 'Cliente del sistema', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Asignar permisos a roles (Administrador - Acceso Total)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Asignar permisos a Supervisor
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'supervisor'
AND p.name IN (
    'VIEW_SETTINGS', 'VIEW_USERS', 'VIEW_ALL_ORDERS', 'UPDATE_ORDER_STATUS',
    'ASSIGN_DELIVERY', 'VIEW_DELIVERIES', 'VIEW_REPORTS'
)
ON CONFLICT DO NOTHING;

-- Asignar permisos a Cajero
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'cashier'
AND p.name IN ('CREATE_ORDER', 'VIEW_ALL_ORDERS', 'UPDATE_ORDER_STATUS')
ON CONFLICT DO NOTHING;

-- Asignar permisos a Repartidor
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'driver'
AND p.name IN ('VIEW_DELIVERIES', 'UPDATE_DELIVERY_STATUS')
ON CONFLICT DO NOTHING;

-- =============================================
-- PARTE 6: FUNCIONES DE UTILIDAD
-- =============================================

-- Función para verificar si un usuario tiene un permiso específico
CREATE OR REPLACE FUNCTION public.user_has_permission(
    user_id_input UUID,
    permission_name_input TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        JOIN public.role_permissions rp ON p.role_id = rp.role_id
        JOIN public.permissions perm ON rp.permission_id = perm.id
        WHERE p.id = user_id_input
        AND perm.name = permission_name_input
    ) INTO has_perm;
    
    RETURN COALESCE(has_perm, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener todos los permisos de un usuario
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id_input UUID)
RETURNS TABLE(permission_name TEXT, permission_category TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT perm.name, perm.category
    FROM public.profiles p
    JOIN public.role_permissions rp ON p.role_id = rp.role_id
    JOIN public.permissions perm ON rp.permission_id = perm.id
    WHERE p.id = user_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para calcular costo de delivery basado en configuración
CREATE OR REPLACE FUNCTION public.calculate_delivery_fee(
    order_subtotal NUMERIC,
    distance_km NUMERIC DEFAULT NULL
) RETURNS NUMERIC AS $$
DECLARE
    settings RECORD;
    calculated_fee NUMERIC;
BEGIN
    SELECT * INTO settings FROM public.delivery_settings LIMIT 1;
    
    -- Si el delivery está desactivado, retorna 0
    IF NOT settings.delivery_fee_enabled THEN
        RETURN 0;
    END IF;
    
    -- Si hay umbral de envío gratis y el subtotal lo supera
    IF settings.free_delivery_threshold IS NOT NULL 
       AND order_subtotal >= settings.free_delivery_threshold THEN
        RETURN 0;
    END IF;
    
    -- Si la distancia excede el radio permitido, rechazar (NULL significa error)
    IF distance_km IS NOT NULL 
       AND distance_km > settings.max_delivery_radius_km THEN
        RETURN NULL; -- NULL indica que está fuera de rango
    END IF;
    
    -- Retornar tarifa configurada
    RETURN settings.delivery_fee;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PARTE 7: RLS (Row Level Security)
-- =============================================

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para delivery_settings (solo admins pueden editar)
CREATE POLICY "Anyone can view delivery settings" ON public.delivery_settings
    FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can update delivery settings" ON public.delivery_settings
    FOR UPDATE USING (public.user_has_permission(auth.uid(), 'MANAGE_DELIVERY_CONFIG'));

-- Políticas para delivery_drivers
CREATE POLICY "Admins and supervisors can view drivers" ON public.delivery_drivers
    FOR SELECT USING (
        public.user_has_permission(auth.uid(), 'MANAGE_DRIVERS') OR
        public.user_has_permission(auth.uid(), 'VIEW_DELIVERIES')
    );

CREATE POLICY "Drivers can view their own profile" ON public.delivery_drivers
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage drivers insert" ON public.delivery_drivers
    FOR INSERT WITH CHECK (public.user_has_permission(auth.uid(), 'MANAGE_DRIVERS'));

CREATE POLICY "Admins can manage drivers update" ON public.delivery_drivers
    FOR UPDATE USING (public.user_has_permission(auth.uid(), 'MANAGE_DRIVERS'));

CREATE POLICY "Admins can manage drivers delete" ON public.delivery_drivers
    FOR DELETE USING (public.user_has_permission(auth.uid(), 'MANAGE_DRIVERS'));

-- Políticas para order_deliveries
CREATE POLICY "Staff can view all deliveries" ON public.order_deliveries
    FOR SELECT USING (public.user_has_permission(auth.uid(), 'VIEW_DELIVERIES'));

CREATE POLICY "Drivers can view assigned deliveries" ON public.order_deliveries
    FOR SELECT USING (
        driver_id IN (SELECT id FROM public.delivery_drivers WHERE user_id = auth.uid())
    );

CREATE POLICY "Supervisors can assign deliveries" ON public.order_deliveries
    FOR INSERT WITH CHECK (public.user_has_permission(auth.uid(), 'ASSIGN_DELIVERY'));

CREATE POLICY "Drivers can update delivery status" ON public.order_deliveries
    FOR UPDATE USING (
        driver_id IN (SELECT id FROM public.delivery_drivers WHERE user_id = auth.uid())
        AND public.user_has_permission(auth.uid(), 'UPDATE_DELIVERY_STATUS')
    );

-- Políticas para permisos y roles
CREATE POLICY "Anyone can view permissions" ON public.permissions
    FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can view roles" ON public.roles
    FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can view role_permissions" ON public.role_permissions
    FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can insert roles" ON public.roles
    FOR INSERT WITH CHECK (public.user_has_permission(auth.uid(), 'MANAGE_ROLES'));

CREATE POLICY "Only admins can update roles" ON public.roles
    FOR UPDATE USING (public.user_has_permission(auth.uid(), 'MANAGE_ROLES'));

CREATE POLICY "Only admins can delete roles" ON public.roles
    FOR DELETE USING (public.user_has_permission(auth.uid(), 'MANAGE_ROLES'));

-- Políticas para audit_logs 
CREATE POLICY "Staff can view audit logs" ON public.audit_logs
    FOR SELECT USING (public.user_has_permission(auth.uid(), 'VIEW_REPORTS'));

-- Permitir inserción automática por triggers (postgres role)
-- O permitir inserción explícita si el backend lo hace
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (TRUE);

-- =============================================
-- PARTE 8: TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- =============================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_delivery_settings_updated_at BEFORE UPDATE ON public.delivery_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_drivers_updated_at BEFORE UPDATE ON public.delivery_drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_deliveries_updated_at BEFORE UPDATE ON public.order_deliveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para crear log de auditoría en cambios de configuración
CREATE OR REPLACE FUNCTION log_delivery_settings_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        TG_OP,
        'delivery_settings',
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_delivery_settings_changes
    AFTER UPDATE ON public.delivery_settings
    FOR EACH ROW
    EXECUTE FUNCTION log_delivery_settings_changes();

-- =============================================
-- COMENTARIOS FINALES
-- =============================================

COMMENT ON TABLE public.delivery_settings IS 'Configuración global del sistema de delivery';
COMMENT ON TABLE public.delivery_drivers IS 'Información de repartidores activos';
COMMENT ON TABLE public.order_deliveries IS 'Asignaciones y tracking de deliveries';
COMMENT ON TABLE public.permissions IS 'Permisos disponibles en el sistema';
COMMENT ON TABLE public.roles IS 'Roles del sistema con permisos asociados';
COMMENT ON TABLE public.audit_logs IS 'Registro de auditoría para cambios críticos';

COMMENT ON FUNCTION public.user_has_permission IS 'Verifica si un usuario tiene un permiso específico';
COMMENT ON FUNCTION public.calculate_delivery_fee IS 'Calcula el costo de delivery basado en configuración activa';
