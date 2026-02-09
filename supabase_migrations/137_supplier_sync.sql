
-- ACTUALIZACIÓN DE PROVEEDORES PARA COMPATIBILIDAD UI
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Si existe is_active, lo usamos, si no, renombramos active o creamos un alias
-- Por ahora añadimos is_active para que la UI no rompa
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
