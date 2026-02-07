-- =========================================================
-- SISTEMA DE AUDITORÍA AVANZADA V1.0
-- Objetivo: Rastrear quién hizo qué, cuándo y desde dónde
-- =========================================================

BEGIN;

-- 1. Tabla de Logs de Auditoría
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id), -- Quién lo hizo (puede ser NULL si es sistema)
    action VARCHAR(50) NOT NULL,                 -- INSERT, UPDATE, DELETE
    entity_type VARCHAR(50) NOT NULL,            -- Nombre de la tabla (ej. orders)
    entity_id UUID,                              -- ID del registro afectado
    old_values JSONB,                            -- Valores antes del cambio
    new_values JSONB,                            -- Valores después del cambio
    ip_address INET,                             -- IP del usuario (si disponible)
    user_agent TEXT,                             -- Navegador/Dispositivo
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas (Vital para logs grandes)
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON public.audit_logs(created_at DESC);

-- Habilitar RLS (Solo admins pueden ver logs)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 2. Función Trigger Genérica
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Intentar obtener el ID del usuario actual
    v_user_id := auth.uid();

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (
            user_id, action, entity_type, entity_id, old_values
        ) VALUES (
            v_user_id, TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD)
        );
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Solo registrar si hubo cambios reales (ignorar updates vacíos)
        IF NEW IS DISTINCT FROM OLD THEN
            INSERT INTO public.audit_logs (
                user_id, action, entity_type, entity_id, old_values, new_values
            ) VALUES (
                v_user_id, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW)
            );
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
         INSERT INTO public.audit_logs (
            user_id, action, entity_type, entity_id, new_values
        ) VALUES (
            v_user_id, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Aplicar Auditoría a Tablas Críticas (Descomentar según necesidad)

-- Pedidos y Ventas
DROP TRIGGER IF EXISTS audit_orders_trigger ON public.orders;
CREATE TRIGGER audit_orders_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Pagos (Crítico)
DROP TRIGGER IF EXISTS audit_payments_trigger ON public.sale_payments;
CREATE TRIGGER audit_payments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.sale_payments
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Movimientos de Caja (Crítico)
DROP TRIGGER IF EXISTS audit_cash_movements_trigger ON public.cash_movements;
CREATE TRIGGER audit_cash_movements_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.cash_movements
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Sesiones de Caja
DROP TRIGGER IF EXISTS audit_cashbox_sessions_trigger ON public.cashbox_sessions;
CREATE TRIGGER audit_cashbox_sessions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.cashbox_sessions
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Turnos
DROP TRIGGER IF EXISTS audit_shifts_trigger ON public.shifts;
CREATE TRIGGER audit_shifts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.shifts
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Inventario (Opcional, puede generar muchos logs)
-- DROP TRIGGER IF EXISTS audit_inventory_trigger ON public.inventory_items;
-- CREATE TRIGGER audit_inventory_trigger
--    AFTER INSERT OR UPDATE OR DELETE ON public.inventory_items
--    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Empleados/Perfiles (Seguridad)
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

COMMIT;

SELECT '✅ Sistema de Auditoría V1.0 Instalado Correctamente' as status;
