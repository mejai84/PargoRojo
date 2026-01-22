-- MIGRACIÓN PARA ANALÍTICAS AVANZADAS
-- Este script habilita el seguimiento de tiempos de preparación y categorización de gastos.

-- 1. Mejoras en Caja Menor: Categorización
ALTER TABLE public.petty_cash_vouchers 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Otros';

-- 2. Mejoras en Ordenes: Tiempos de Cocina
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS preparation_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS preparation_finished_at TIMESTAMPTZ;

-- 3. Mejoras en Mesas: Tiempo de Ocupación
ALTER TABLE public.tables 
ADD COLUMN IF NOT EXISTS occupied_at TIMESTAMPTZ;

-- 4. Actualizar las categorías existentes si es necesario
-- (Cualquier lógica de limpieza de datos iría aquí)
