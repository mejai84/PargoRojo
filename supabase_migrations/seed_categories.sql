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
    (gen_random_uuid(), 'Entradas', 'entradas', 'Para empezar con el mejor sabor', 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=800', 1),
    (gen_random_uuid(), 'Pescados y Mariscos', 'pescados-mariscos', 'Frescura del mar a tu mesa', 'https://images.unsplash.com/photo-1519708227418-c8fd9a3a1b78?q=80&w=800', 2),
    (gen_random_uuid(), 'Ricuras de nuestra Región', 'ricuras-region', 'Sabores auténticos locales', 'https://images.unsplash.com/photo-1599488615731-7e512807e69c?q=80&w=800', 3),
    (gen_random_uuid(), 'Cortes Gruesos', 'cortes-gruesos', 'Carne de primera calidad', 'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=800', 4),
    (gen_random_uuid(), 'Especialidades a la Brasa', 'especialidades-brasa', 'El inconfundible sabor a leña', 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?q=80&w=800', 5),
    (gen_random_uuid(), 'Cerdo', 'cerdo', 'Deliciosos cortes de cerdo', 'https://images.unsplash.com/photo-1625938143997-fa7046830561?q=80&w=800', 6),
    (gen_random_uuid(), 'Arroces', 'arroces', 'Variedad de arroces especiales', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=800', 7),
    (gen_random_uuid(), 'Pollos', 'pollos', 'Pollo jugoso y dorado', 'https://images.unsplash.com/photo-1626082927389-d31c6d30a80c?q=80&w=800', 8),
    (gen_random_uuid(), 'Pastas', 'pastas', 'Pastas frescas y salsas caseras', 'https://images.unsplash.com/photo-1612874742237-752d8b43029a?q=80&w=800', 9),
    (gen_random_uuid(), 'Comida Montañera', 'comida-montanera', 'Para los de buen apetito', 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?q=80&w=800', 10),
    (gen_random_uuid(), 'Lasañas', 'lasanas', 'Capas de sabor irresistible', 'https://images.unsplash.com/photo-1574868291010-919246d6b6bf?q=80&w=800', 11),
    (gen_random_uuid(), 'Comidas Rápidas', 'comidas-rapidas', 'Sabor rápido y delicioso', 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=800', 12),
    (gen_random_uuid(), 'Menú Infantil', 'menu-infantil', 'Para los más pequeños', 'https://images.unsplash.com/photo-1562694165-3733076c8e31?q=80&w=800', 13),
    (gen_random_uuid(), 'Asados', 'asados', 'Lo mejor de la parrilla', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800', 14),
    (gen_random_uuid(), 'Desayunos', 'desayunos', 'Empieza bien el día', 'https://images.unsplash.com/photo-1533089862017-ec329abb0a0b?q=80&w=800', 15),
    (gen_random_uuid(), 'Adicionales y Bebidas', 'adicionales-bebidas', 'Acompañantes y refrescos', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800', 16);

-- Verificar insercion
SELECT name, slug, sort_order FROM categories ORDER BY sort_order;
