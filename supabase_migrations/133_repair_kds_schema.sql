-- REPARACIÓN DE ESQUEMA KDS
-- Añade la columna station_id a products si no existe y asegura la tabla prep_stations.

CREATE TABLE IF NOT EXISTS public.prep_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS si no estaba
ALTER TABLE public.prep_stations ENABLE ROW LEVEL SECURITY;

-- Añadir columna a productos
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'station_id') THEN
        ALTER TABLE public.products ADD COLUMN station_id UUID REFERENCES public.prep_stations(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Insertar estaciones por defecto para el restaurante actual si no hay ninguna
INSERT INTO public.prep_stations (restaurant_id, name, description)
SELECT id, 'Cocina General', 'Punto de preparación por defecto'
FROM public.restaurants
WHERE NOT EXISTS (SELECT 1 FROM public.prep_stations WHERE restaurant_id = public.restaurants.id)
ON CONFLICT DO NOTHING;

-- Asignar todos los productos a la primera estación del restaurante por defecto
DO $$
DECLARE
    v_station_id UUID;
    v_res_id UUID;
BEGIN
    FOR v_res_id IN SELECT id FROM public.restaurants LOOP
        SELECT id INTO v_station_id FROM public.prep_stations WHERE restaurant_id = v_res_id LIMIT 1;
        IF v_station_id IS NOT NULL THEN
            UPDATE public.products SET station_id = v_station_id WHERE restaurant_id = v_res_id AND station_id IS NULL;
        END IF;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
