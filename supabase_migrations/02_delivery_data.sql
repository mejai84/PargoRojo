-- PASO 2: DATOS INICIALES Y LÓGICA
-- Ejecutar después de 01_delivery_tables.sql

-- Insertar configuración inicial
INSERT INTO public.delivery_settings (
    delivery_fee_enabled,
    delivery_fee,
    max_delivery_radius_km,
    restaurant_address,
    restaurant_phone
) 
SELECT TRUE, 5000, 3, 'Calle Principal #123, Barrio Centro', '+57 300 123 4567'
WHERE NOT EXISTS (SELECT 1 FROM public.delivery_settings);

-- Insertar permisos
INSERT INTO public.permissions (name, description, category) VALUES
('MANAGE_SETTINGS', 'Gestionar configuración del negocio', 'settings'),
('VIEW_SETTINGS', 'Ver configuración del negocio', 'settings'),
('MANAGE_DELIVERY_CONFIG', 'Gestionar configuración de delivery', 'settings'),
('MANAGE_USERS', 'Crear, editar y eliminar usuarios', 'users'),
('VIEW_USERS', 'Ver lista de usuarios', 'users'),
('MANAGE_ROLES', 'Gestionar roles y permisos', 'users'),
('CREATE_ORDER', 'Crear pedidos', 'orders'),
('VIEW_ALL_ORDERS', 'Ver todos los pedidos', 'orders'),
('VIEW_OWN_ORDERS', 'Ver solo pedidos propios', 'orders'),
('UPDATE_ORDER_STATUS', 'Actualizar estado de pedidos', 'orders'),
('CANCEL_ORDER', 'Cancelar pedidos', 'orders'),
('ASSIGN_DELIVERY', 'Asignar repartidor a pedidos', 'delivery'),
('MANAGE_DRIVERS', 'Gestionar repartidores', 'delivery'),
('VIEW_DELIVERIES', 'Ver deliveries asignados', 'delivery'),
('UPDATE_DELIVERY_STATUS', 'Actualizar estado de delivery', 'delivery'),
('VIEW_REPORTS', 'Ver reportes generales', 'reports'),
('VIEW_FINANCIAL_REPORTS', 'Ver reportes financieros', 'reports'),
('EXPORT_DATA', 'Exportar datos', 'reports')
ON CONFLICT (name) DO NOTHING;

-- Insertar roles
INSERT INTO public.roles (name, description, is_system_role) VALUES
('admin', 'Administrador con acceso total', TRUE),
('supervisor', 'Supervisor con acceso limitado a configuración', TRUE),
('cashier', 'Cajero con acceso a ventas', TRUE),
('driver', 'Repartidor con acceso a sus deliveries', TRUE),
('waiter', 'Mesero con acceso al portal de mesas', TRUE),
('kitchen', 'Personal de cocina', TRUE),
('user', 'Cliente del sistema', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Asignar permisos a roles (Admin)
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
AND p.name IN ('VIEW_SETTINGS', 'VIEW_USERS', 'VIEW_ALL_ORDERS', 'UPDATE_ORDER_STATUS', 'ASSIGN_DELIVERY', 'VIEW_DELIVERIES', 'VIEW_REPORTS')
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

-- Función de chequeo de permisos
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

-- Función para obtener permisos
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

-- Función de cálculo de delivery
CREATE OR REPLACE FUNCTION public.calculate_delivery_fee(
    order_subtotal NUMERIC,
    distance_km NUMERIC DEFAULT NULL
) RETURNS NUMERIC AS $$
DECLARE
    settings RECORD;
BEGIN
    SELECT * INTO settings FROM public.delivery_settings LIMIT 1;
    
    IF NOT settings.delivery_fee_enabled THEN RETURN 0; END IF;
    
    IF settings.free_delivery_threshold IS NOT NULL 
       AND order_subtotal >= settings.free_delivery_threshold THEN
        RETURN 0;
    END IF;
    
    IF distance_km IS NOT NULL 
       AND distance_km > settings.max_delivery_radius_km THEN
        RETURN NULL;
    END IF;
    
    RETURN settings.delivery_fee;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger auditoría
CREATE OR REPLACE FUNCTION log_delivery_settings_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id, action, entity_type, entity_id, old_values, new_values
    ) VALUES (
        auth.uid(), TG_OP, 'delivery_settings', NEW.id, to_jsonb(OLD), to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_delivery_settings_changes ON public.delivery_settings;
CREATE TRIGGER audit_delivery_settings_changes
    AFTER UPDATE ON public.delivery_settings
    FOR EACH ROW EXECUTE FUNCTION log_delivery_settings_changes();
