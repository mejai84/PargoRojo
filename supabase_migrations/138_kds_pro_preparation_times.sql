-- =====================================================
-- KDS PRO: SISTEMA DE TIEMPOS INTELIGENTE
-- =====================================================

-- Agregar tiempo de preparación estimado a productos
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS preparation_time INTEGER DEFAULT 10;

COMMENT ON COLUMN public.products.preparation_time IS 'Tiempo estimado de preparación en minutos';

-- Actualizar tiempos por defecto según categorías comunes
UPDATE public.products 
SET preparation_time = 5 
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%bebida%' OR name ILIKE '%drink%');

UPDATE public.products 
SET preparation_time = 15 
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%entrada%' OR name ILIKE '%appetizer%');

UPDATE public.products 
SET preparation_time = 20 
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%plato fuerte%' OR name ILIKE '%main%' OR name ILIKE '%principal%');

UPDATE public.products 
SET preparation_time = 8 
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%postre%' OR name ILIKE '%dessert%');

-- Índice para optimizar consultas de KDS
CREATE INDEX IF NOT EXISTS idx_products_prep_time ON public.products(preparation_time);
CREATE INDEX IF NOT EXISTS idx_products_station_time ON public.products(station_id, preparation_time);
