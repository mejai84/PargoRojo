-- PASO 3: POLÍTICAS DE SEGURIDAD (RLS)
-- Ejecutar después de 01_delivery_tables.sql y 02_delivery_data.sql

-- Habilitar RLS
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas viejas si existen
DROP POLICY IF EXISTS "Anyone can view delivery settings" ON public.delivery_settings;
DROP POLICY IF EXISTS "Only admins can update delivery settings" ON public.delivery_settings;
DROP POLICY IF EXISTS "Admins and supervisors can view drivers" ON public.delivery_drivers;
DROP POLICY IF EXISTS "Drivers can view their own profile" ON public.delivery_drivers;
DROP POLICY IF EXISTS "Admins can manage drivers insert" ON public.delivery_drivers;
DROP POLICY IF EXISTS "Admins can manage drivers update" ON public.delivery_drivers;
DROP POLICY IF EXISTS "Admins can manage drivers delete" ON public.delivery_drivers;
DROP POLICY IF EXISTS "Staff can view all deliveries" ON public.order_deliveries;
DROP POLICY IF EXISTS "Drivers can view assigned deliveries" ON public.order_deliveries;
DROP POLICY IF EXISTS "Supervisors can assign deliveries" ON public.order_deliveries;
DROP POLICY IF EXISTS "Drivers can update delivery status" ON public.order_deliveries;
DROP POLICY IF EXISTS "Anyone can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;
DROP POLICY IF EXISTS "Anyone can view role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Staff can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Políticas delivery_settings
CREATE POLICY "Anyone can view delivery settings" ON public.delivery_settings
    FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can update delivery settings" ON public.delivery_settings
    FOR UPDATE USING (public.user_has_permission(auth.uid(), 'MANAGE_DELIVERY_CONFIG'));

-- Políticas delivery_drivers
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

-- Políticas order_deliveries
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

-- Políticas generales
CREATE POLICY "Anyone can view permissions" ON public.permissions FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can view roles" ON public.roles FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can view role_permissions" ON public.role_permissions FOR SELECT USING (TRUE);

-- Políticas roles (admin only)
CREATE POLICY "Only admins can insert roles" ON public.roles
    FOR INSERT WITH CHECK (public.user_has_permission(auth.uid(), 'MANAGE_ROLES'));

CREATE POLICY "Only admins can update roles" ON public.roles
    FOR UPDATE USING (public.user_has_permission(auth.uid(), 'MANAGE_ROLES'));

CREATE POLICY "Only admins can delete roles" ON public.roles
    FOR DELETE USING (public.user_has_permission(auth.uid(), 'MANAGE_ROLES'));

-- Políticas audit
CREATE POLICY "Staff can view audit logs" ON public.audit_logs
    FOR SELECT USING (public.user_has_permission(auth.uid(), 'VIEW_REPORTS'));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (TRUE);
