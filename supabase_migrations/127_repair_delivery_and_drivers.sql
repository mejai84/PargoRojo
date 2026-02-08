-- MODULO: DELIVERY & REPARTIDORES
-- REPARACIÓN DE PERMISOS, RLS Y DATOS INICIALES

-- 1. Asegurar que existe configuración de delivery inicial
INSERT INTO public.delivery_settings (
    delivery_fee_enabled,
    delivery_fee,
    max_delivery_radius_km,
    restaurant_address,
    restaurant_phone,
    delivery_active,
    pickup_active
) 
SELECT TRUE, 5000, 3, 'Calle Principal #123', '+57 300 123 4567', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.delivery_settings);

-- 2. Actualizar la función user_has_permission para ser más robusta
-- Ahora también revisa la columna 'role' (texto) por compatibilidad
CREATE OR REPLACE FUNCTION public.user_has_permission(
    user_id_input UUID,
    permission_name_input TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    u_role TEXT;
    has_perm BOOLEAN;
BEGIN
    -- Primero chequear por el rol de texto directo (Super Admins)
    SELECT role INTO u_role FROM public.profiles WHERE id = user_id_input;
    
    IF u_role = 'admin' THEN
        RETURN TRUE;
    END IF;

    -- Luego chequear por el sistema de permisos granulares
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

-- 3. Corregir RLS de delivery_drivers para permitir a administradores (por rol de texto)
DROP POLICY IF EXISTS "Admins can manage drivers insert" ON public.delivery_drivers;
CREATE POLICY "Admins can manage drivers insert" ON public.delivery_drivers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager')
        ) OR public.user_has_permission(auth.uid(), 'MANAGE_DRIVERS')
    );

DROP POLICY IF EXISTS "Admins can manage drivers update" ON public.delivery_drivers;
CREATE POLICY "Admins can manage drivers update" ON public.delivery_drivers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager')
        ) OR public.user_has_permission(auth.uid(), 'MANAGE_DRIVERS')
    );

DROP POLICY IF EXISTS "Admins and supervisors can view drivers" ON public.delivery_drivers;
CREATE POLICY "Admins and supervisors can view drivers" ON public.delivery_drivers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (role IN ('admin', 'manager', 'cashier'))
        ) OR public.user_has_permission(auth.uid(), 'MANAGE_DRIVERS') 
          OR public.user_has_permission(auth.uid(), 'VIEW_DELIVERIES')
    );

-- 4. Asegurar que delivery_settings pueda ser visto por todos los autenticados
DROP POLICY IF EXISTS "Anyone can view delivery settings" ON public.delivery_settings;
CREATE POLICY "Anyone can view delivery settings" ON public.delivery_settings
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can update delivery settings" ON public.delivery_settings;
CREATE POLICY "Only admins can update delivery settings" ON public.delivery_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager')
        ) OR public.user_has_permission(auth.uid(), 'MANAGE_DELIVERY_CONFIG')
    );

-- Recargar caché de esquema (Muy importante para cambios de RLS y tipos)
NOTIFY pgrst, 'reload schema';
