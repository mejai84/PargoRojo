-- =========================================================
-- SISTEMA DE PERMISOS GRANULAR V1.0 (COMPLETO Y CORREGIDO)
-- Objetivo: Permitir asignar capacidades específicas a usuarios
--           manteniendo la compatibilidad con roles actuales
-- =========================================================

BEGIN;

-- 1. Enum de Permisos (Para consistencia)
DROP TYPE IF EXISTS public.permission_type CASCADE;
CREATE TYPE public.permission_type AS ENUM (
    'sell',                    -- Vender (Pedidos, Cobrar)
    'refund',                  -- Hacer devoluciones
    'discount',                -- Aplicar descuentos
    'void_order',              -- Anular órdenes
    'open_cash',               -- Abrir caja
    'close_cash',              -- Cerrar caja
    'view_reports',            -- Ver reportes financieros
    'manage_inventory',        -- Gestionar stock/ingresos
    'manage_employees',        -- Crear/Editar empleados
    'change_prices',           -- Modificar menú y precios
    'access_waiter_portal',    -- Mesero
    'access_kitchen',          -- Cocina
    'manage_reservations',     -- Reservas
    'access_delivery_app',     -- App Domiciliario
    'manage_deliveries'        -- Gestión Domicilios (Manager)
);

-- 2. Tabla de Permisos por Usuario
-- DROP TABLE para asegurar limpieza total si existe versión corrupta
DROP TABLE IF EXISTS public.user_permissions CASCADE;

CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    permission public.permission_type NOT NULL,
    granted_by UUID REFERENCES public.profiles(id), -- Quién lo otorgó
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, permission) -- Evitar duplicados
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_permissions_user ON public.user_permissions(user_id);

-- RLS (Seguridad)
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas (con DROP IF EXISTS para evitar errores de duplicados)
DROP POLICY IF EXISTS "Admins can view all permissions" ON public.user_permissions;
CREATE POLICY "Admins can view all permissions" ON public.user_permissions
    FOR SELECT TO authenticated
    USING (
        EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' )
        OR user_id = auth.uid() -- O uno mismo
    );

DROP POLICY IF EXISTS "Admins can manage permissions" ON public.user_permissions;
CREATE POLICY "Admins can manage permissions" ON public.user_permissions
    FOR ALL TO authenticated
    USING ( EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' ) );


-- 3. Funciones Helper para Backend/Trigger
CREATE OR REPLACE FUNCTION public.check_user_permission(
    check_user_id UUID,
    perm_name TEXT
) 
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    has_perm BOOLEAN;
BEGIN
    -- 1. Obtener rol
    SELECT role INTO user_role FROM public.profiles WHERE id = check_user_id;
    
    -- 2. Admins tienen TODOS los permisos (Superuser lógico)
    IF user_role = 'admin' THEN
        RETURN TRUE;
    END IF;

    -- 3. Verificar permiso específico
    SELECT EXISTS (
        SELECT 1 FROM public.user_permissions
        WHERE user_id = check_user_id 
        AND permission::text = perm_name
    ) INTO has_perm;

    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Datos Iniciales (Migración Automática de Roles a Permisos)
-- Asignamos permisos base según el rol actual del usuario

-- CAJEROS
INSERT INTO public.user_permissions (user_id, permission)
SELECT id, 'sell'::permission_type FROM public.profiles WHERE role = 'cashier'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_permissions (user_id, permission)
SELECT id, 'open_cash'::permission_type FROM public.profiles WHERE role = 'cashier'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_permissions (user_id, permission)
SELECT id, 'close_cash'::permission_type FROM public.profiles WHERE role = 'cashier'
ON CONFLICT DO NOTHING;

-- MESEROS
INSERT INTO public.user_permissions (user_id, permission)
SELECT id, 'access_waiter_portal'::permission_type FROM public.profiles WHERE role = 'waiter'
ON CONFLICT DO NOTHING;

-- COCINA
INSERT INTO public.user_permissions (user_id, permission)
SELECT id, 'access_kitchen'::permission_type FROM public.profiles WHERE role IN ('cook', 'chef')
ON CONFLICT DO NOTHING;

-- MANAGER
INSERT INTO public.user_permissions (user_id, permission)
SELECT id, unnest(ARRAY['sell', 'view_reports', 'manage_inventory', 'manage_reservations', 'manage_deliveries']::permission_type[])
FROM public.profiles WHERE role = 'manager'
ON CONFLICT DO NOTHING;


-- DRIVERS (Domiciliarios)
INSERT INTO public.user_permissions (user_id, permission)
SELECT id, 'access_delivery_app'::permission_type FROM public.profiles WHERE role = 'driver'
ON CONFLICT DO NOTHING;

COMMIT;

SELECT '✅ Sistema de Permisos Granular V1.0 (COMPLETO) Instalado Correctamente' as status;
