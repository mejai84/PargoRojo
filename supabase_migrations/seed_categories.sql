-- Actualizar Estructura y Repoblar Categorias

-- 1. Asegurar que las columnas existan
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'description') THEN
        ALTER TABLE categories ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'sort_order') THEN
        ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'slug') THEN
        ALTER TABLE categories ADD COLUMN slug VARCHAR(100);
    END IF;
    
    -- Crear indice unico para slug si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'categories' AND indexname = 'categories_slug_key') THEN
        CREATE UNIQUE INDEX categories_slug_key ON categories(slug);
    END IF;
END $$;

-- 2. Limpiar datos existentes
TRUNCATE TABLE categories CASCADE;

-- 3. Insertar nuevas categorias
INSERT INTO categories (id, name, slug, description, image_url, sort_order) VALUES
    (gen_random_uuid(), 'Entradas', 'entradas', 'Para empezar con el mejor sabor del mar', 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=800', 1),
    (gen_random_uuid(), 'Pescados', 'pescados', 'Los mejores pescados frescos del día', 'https://images.unsplash.com/photo-1519708227418-c8fd9a3a1b78?q=80&w=800', 2),
    (gen_random_uuid(), 'Mariscos', 'mariscos', 'Cazuelas, arroces y frutos del mar', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=800', 3),
    (gen_random_uuid(), 'Carnes y Aves', 'carnes-aves', 'Opciones deliciosas de tierra', 'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=800', 4),
    (gen_random_uuid(), 'Bebidas', 'bebidas', 'Refrescantes bebidas naturales y gaseosas', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800', 5),
    (gen_random_uuid(), 'Cocteles', 'cocteles', 'Para disfrutar frente al mar', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800', 6),
    (gen_random_uuid(), 'Adicionales', 'adicionales', 'Porciones extra para acompañar', 'https://images.unsplash.com/photo-1623961990059-2843770d32e9?q=80&w=800', 7);

-- Verificar insercion
SELECT name, slug, sort_order FROM categories ORDER BY sort_order;
