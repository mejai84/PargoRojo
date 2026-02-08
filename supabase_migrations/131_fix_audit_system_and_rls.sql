-- ========================================================
-- MIGRACIÓN 131: REPARACIÓN DEL SISTEMA DE AUDITORÍA
-- Fecha: 8 de febrero de 2026
-- Propósito: Permitir que los triggers de auditoría funcionen con RLS habilitado.
-- ========================================================

-- 1. Actualizar la función de auditoría para que tenga privilegios de escritura (SECURITY DEFINER)
-- y para que capture el restaurant_id automáticamente de los registros.
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Esto permite que el trigger escriba en audit_logs aunque el usuario no tenga permiso RLS
AS $$
DECLARE
    v_user_id UUID;
    v_restaurant_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Intentar capturar restaurant_id del registro (NEW o OLD)
    IF (TG_OP = 'DELETE') THEN
        BEGIN v_restaurant_id := OLD.restaurant_id; EXCEPTION WHEN OTHERS THEN v_restaurant_id := NULL; END;
    ELSE
        BEGIN v_restaurant_id := NEW.restaurant_id; EXCEPTION WHEN OTHERS THEN v_restaurant_id := NULL; END;
    END IF;

    -- Si no se encontró en el registro, intentar obtenerlo del perfil del usuario
    IF v_restaurant_id IS NULL AND v_user_id IS NOT NULL THEN
        v_restaurant_id := public.get_my_restaurant_id();
    END IF;

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (
            user_id, restaurant_id, action, entity_type, entity_id, old_values
        ) VALUES (
            v_user_id, v_restaurant_id, TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD)
        );
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF NEW IS DISTINCT FROM OLD THEN
            INSERT INTO public.audit_logs (
                user_id, restaurant_id, action, entity_type, entity_id, old_values, new_values
            ) VALUES (
                v_user_id, v_restaurant_id, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW)
            );
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
         INSERT INTO public.audit_logs (
            user_id, restaurant_id, action, entity_type, entity_id, new_values
        ) VALUES (
            v_user_id, v_restaurant_id, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- 2. Asegurar que audit_logs tiene las columnas necesarias
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'restaurant_id') THEN
        ALTER TABLE public.audit_logs ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id);
    END IF;
END $$;

-- 3. Reactivar RLS en las tablas que desactivamos para debug
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 4. Asegurar políticas básicas en shifts para que el cajero pueda operar
DROP POLICY IF EXISTS "Cashiers manage own shifts" ON public.shifts;
CREATE POLICY "Cashiers manage own shifts" ON public.shifts
FOR ALL USING (
    user_id = auth.uid() 
    AND restaurant_id = public.get_my_restaurant_id()
);

-- 5. Recargar esquema
NOTIFY pgrst, 'reload schema';
