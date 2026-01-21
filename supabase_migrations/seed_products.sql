-- Actualizar Estructura y Repoblar Productos

-- 1. Asegurar estructura de tabla
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'available') THEN
        ALTER TABLE products ADD COLUMN available BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'preparation_time') THEN
        ALTER TABLE products ADD COLUMN preparation_time INTEGER DEFAULT 15; -- minutos
    END IF;
END $$;

-- 2. Limpiar tabla de productos
TRUNCATE TABLE products CASCADE;

-- 3. Insertar productos (Usando las categorias recien creadas)

-- ENTRADAS
INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Ceviche de Camarón', 'Camarones frescos marinados en limón, cebolla, cilantro y salsa de la casa.', 25000, id, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58', true, 10
FROM categories WHERE slug = 'entradas';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Patacones con Hogao', '4 patacones crocantes acompañados de hogao criollo y queso costeño.', 12000, id, 'https://images.unsplash.com/photo-1623961990059-2843770d32e9', true, 15
FROM categories WHERE slug = 'entradas';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Muelas de Cangrejo', 'Deliciosas muelas de cangrejo al ajillo.', 35000, id, 'https://images.unsplash.com/photo-1599321955361-9f93922c2621', true, 20
FROM categories WHERE slug = 'entradas';

-- PESCADOS Y MARISCOS
INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Pargo Rojo Frito', 'Pargo rojo fresco (500g) frito, acompañado de arroz con coco, patacones y ensalada.', 45000, id, 'https://images.unsplash.com/photo-1519708227418-c8fd9a3a1b78', true, 25
FROM categories WHERE slug = 'pescados-mariscos';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Mojarra Frita', 'Mojarra fresca frita, acompañada de arroz con coco y patacones.', 35000, id, 'https://images.unsplash.com/photo-1598514986237-7f9cb633783a', true, 25
FROM categories WHERE slug = 'pescados-mariscos';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Sierra en Posta', 'Posta de sierra frita o guisada en leche de coco.', 38000, id, 'https://images.unsplash.com/photo-1582234032483-4903268846c9', true, 30
FROM categories WHERE slug = 'pescados-mariscos';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Filete de Róbalo', 'Filete de róbalo a la plancha o al ajillo.', 42000, id, 'https://images.unsplash.com/photo-1432139509613-5c4255815697', true, 20
FROM categories WHERE slug = 'pescados-mariscos';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Cazuela de Mariscos', 'La especialidad de la casa. Variedad de mariscos en crema de coco y especias.', 55000, id, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641', true, 30
FROM categories WHERE slug = 'pescados-mariscos';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Arroz con Camarón', 'Arroz húmedo con camarones frescos y verduras.', 40000, id, 'https://images.unsplash.com/photo-1559847844-5315695dadae', true, 25
FROM categories WHERE slug = 'pescados-mariscos';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Langostinos al Ajillo', 'Langostinos jumbo salteados en mantequilla de ajo y vino blanco.', 65000, id, 'https://images.unsplash.com/photo-1549467773-6ac7c0506c19', true, 25
FROM categories WHERE slug = 'pescados-mariscos';

-- CORTES GRUESOS (Antes Carnes)
INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Churrasco', 'Corte de res a la parrilla (300g) acompañado de papas a la francesa.', 38000, id, 'https://images.unsplash.com/photo-1600891964092-4316c288032e', true, 25
FROM categories WHERE slug = 'cortes-gruesos';

-- POLLOS
INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Pechuga a la Plancha', 'Pechuga de pollo grillada con finas hierbas.', 28000, id, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d', true, 20
FROM categories WHERE slug = 'pollos';

-- ADICIONALES Y BEBIDAS
INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Coco Loco', 'Mezcla de rones y frutas servido en un coco natural.', 25000, id, 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b', true, 10
FROM categories WHERE slug = 'adicionales-bebidas';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Piña Colada', 'Ron, crema de coco y piña.', 20000, id, 'https://images.unsplash.com/photo-1544469557-eb0d277d337f', true, 10
FROM categories WHERE slug = 'adicionales-bebidas';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Margarita', 'Tequila, triple sec y limón.', 22000, id, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc', true, 8
FROM categories WHERE slug = 'adicionales-bebidas';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Limonada de Coco', 'Refrescante limonada con leche de coco.', 12000, id, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd', true, 8
FROM categories WHERE slug = 'adicionales-bebidas';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Limonada Cerezada', 'Limonada natural con cerezas.', 10000, id, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd', true, 5
FROM categories WHERE slug = 'adicionales-bebidas';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Cerveza Club Colombia', 'Dorada, Roja o Negra.', 8000, id, 'https://images.unsplash.com/photo-1608270586620-248524c67de9', true, 0
FROM categories WHERE slug = 'adicionales-bebidas';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Gaseosa', 'Coca-Cola, Postobon.', 5000, id, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97', true, 0
FROM categories WHERE slug = 'adicionales-bebidas';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Agua en Botella', 'Con o sin gas.', 4000, id, 'https://images.unsplash.com/photo-1534057306317-49226d06a6f7', true, 0
FROM categories WHERE slug = 'adicionales-bebidas';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Porción de Arroz con Coco', 'Arroz con coco tradicional.', 8000, id, 'https://images.unsplash.com/photo-1616260197775-6e5a6c0b5b9c', true, 5
FROM categories WHERE slug = 'adicionales-bebidas';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Porción de Patacones', '3 unidades.', 6000, id, 'https://images.unsplash.com/photo-1623961990059-2843770d32e9', true, 10
FROM categories WHERE slug = 'adicionales-bebidas';

INSERT INTO products (name, description, price, category_id, image_url, available, preparation_time)
SELECT 'Porción de Papas Fritas', 'Papas a la francesa.', 7000, id, 'https://images.unsplash.com/photo-1630384060421-cb20d006132f', true, 10
FROM categories WHERE slug = 'adicionales-bebidas';

-- Verificar
SELECT p.name, p.price, c.name as category 
FROM products p 
JOIN categories c ON p.category_id = c.id 
ORDER BY c.name, p.name;
