-- ========================================================
-- 🍳 MÓDULO DE ESTACIONES DE PREPARACIÓN (KDS SaaS)
-- Propósito: Gestión multi-estación para cocinas profesionales
-- ========================================================

-- 1. Crear tabla de Estaciones de Preparación
CREATE TABLE IF NOT EXISTS public.prep_stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS para Estaciones
ALTER TABLE public.prep_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SaaS Isolation Selection" ON public.prep_stations FOR SELECT USING (restaurant_id = public.get_my_restaurant_id());
CREATE POLICY "SaaS Isolation Insertion" ON public.prep_stations FOR INSERT WITH CHECK (restaurant_id = public.get_my_restaurant_id());
CREATE POLICY "SaaS Isolation Update" ON public.prep_stations FOR UPDATE USING (restaurant_id = public.get_my_restaurant_id());
CREATE POLICY "SaaS Isolation Delete" ON public.prep_stations FOR DELETE USING (restaurant_id = public.get_my_restaurant_id());

-- 3. Vincular Productos con Estaciones
-- Añadimos la columna station_id a la tabla de productos
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'station_id') THEN
        ALTER TABLE public.products ADD COLUMN station_id UUID REFERENCES public.prep_stations(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Insertar estaciones por defecto para el restaurante original (Opcional, pero ayuda al inicio)
DO $$ 
DECLARE 
    res_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN 
    IF EXISTS (SELECT 1 FROM public.restaurants WHERE id = res_id) THEN
        INSERT INTO public.prep_stations (restaurant_id, name, description)
        VALUES 
            (res_id, 'Barra / Bebidas', 'Preparación de jugos, licores y bebidas frías'),
            (res_id, 'Cocina Caliente', 'Parrilla, frituras y platos fuertes'),
            (res_id, 'Entradas / Fríos', 'Ceviches, ensaladas y entradas')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 5. Actualizar la función de recarga de esquema
NOTIFY pgrst, 'reload schema';
