-- PASO 9: CONFIGURACIÓN DE PROPINAS (CUENTA Y RESTAURANTE)

-- 1. Agregar columnas a la tabla de restaurantes para configuración global de propinas
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS apply_service_charge BOOLEAN DEFAULT FALSE;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS service_charge_percentage NUMERIC DEFAULT 10;

-- 2. Agregar columna a la tabla de órdenes para registrar la propina cobrada
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tip_amount NUMERIC DEFAULT 0;

-- 3. Actualizar comentarios para claridad
COMMENT ON COLUMN public.restaurants.apply_service_charge IS 'Indica si el restaurante sugiere/cobra propina automáticamente en la cuenta.';
COMMENT ON COLUMN public.restaurants.service_charge_percentage IS 'Porcentaje predeterminado de propina (Sugerido).';
COMMENT ON COLUMN public.orders.tip_amount IS 'Monto neto de propina cobrado en esta orden.';

-- 4. Notificar recarga de esquema para PostgREST
NOTIFY pgrst, 'reload schema';
