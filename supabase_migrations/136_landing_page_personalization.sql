-- MIGRACIÓN DE PERSONALIZACIÓN LANDING PAGE SaaS
-- Añade una columna JSONB para configurar secciones dinámicas de la página de inicio.

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'landing_page_config') THEN
        ALTER TABLE public.restaurants ADD COLUMN landing_page_config JSONB DEFAULT '{
            "hero": {
                "image_url": "/premium_seafood_hero_1769294804705.png",
                "title_part1": "PARGO",
                "title_part2": "ROJO",
                "tagline": "Gran Rafa | Experiencia Gastronómica de Mar",
                "est_year": "2012",
                "location_city": "Caucasia, Antioquia"
            },
            "essence": [
                {
                    "title": "Ingredientes Premium",
                    "desc": "Seleccionamos diariamente la pesca más fresca y los cortes de carne más exclusivos de la región.",
                    "icon": "Award"
                },
                {
                    "title": "Maestría en Brasa",
                    "desc": "Nuestra técnica de asado tradicional resalta los sabores naturales con el toque único del Gran Rafa.",
                    "icon": "ChefHat"
                },
                {
                    "title": "Legado Familiar",
                    "desc": "Más que un restaurante, somos una tradición que celebra el sabor auténtico del Cauca.",
                    "icon": "Heart"
                }
            ],
            "experience": {
                "image_url": "/premium_restaurant_interior_1769294818416.png",
                "title_part1": "Un espacio diseñado para",
                "title_part2": "Celebrar",
                "description": "Cada rincón cuenta una historia. Hemos creado una atmósfera que combina la calidez tropical con la sofisticación moderna.",
                "tour_link": "#"
            }
        }';
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
