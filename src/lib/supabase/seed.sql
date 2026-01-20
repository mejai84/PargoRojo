
-- Insertar Categorías
INSERT INTO public.categories (name, slug, order_position) VALUES
('Hamburguesas', 'hamburguesas', 1),
('Sandwiches', 'sandwiches', 2),
('Patatas', 'patatas', 3),
('Para Picar', 'para-picar', 4),
('Bebidas', 'bebidas', 5);

-- Obtener IDs de categorías (esto es un script conceptual, en SQL real necesitarías los UUIDs exactos)
-- Asumimos que podemos usar subqueries para insertar productos

-- HAMBURGUESAS (Usando nombres exactos del catálogo)
INSERT INTO public.products (category_id, name, price, ingredients, is_featured, image_url) 
SELECT id, 'Pozu', 12.00, ARRAY['Pan americano', 'Huevo', 'Tomate', 'Bacon', 'Queso cheddar', 'Carne 100% ternera asturiana', 'Salsa especial Pozu', 'Lechuga'], true, '/images/burgers/pozu.png'
FROM public.categories WHERE slug = 'hamburguesas';

INSERT INTO public.products (category_id, name, price, ingredients, is_featured, image_url)
SELECT id, 'Gourmet', 12.00, ARRAY['Cebolla caramelizada', 'Queso de cabra', 'Tomate', 'Bacon', 'Carne 100% ternera asturiana', 'Lechuga'], true, '/images/burgers/gourmet.png'
FROM public.categories WHERE slug = 'hamburguesas';

INSERT INTO public.products (category_id, name, price, ingredients, is_featured, image_url)
SELECT id, 'Selecta', 12.00, ARRAY['Cebolla a la plancha', 'Tomate', 'Salsa barbacoa ahumada', 'Bacon', 'Queso cheddar', 'Carne 100% ternera asturiana', 'Lechuga'], false, '/images/burgers/selecta.png'
FROM public.categories WHERE slug = 'hamburguesas';

INSERT INTO public.products (category_id, name, price, ingredients, is_featured, image_url)
SELECT id, 'Oikos', 12.00, ARRAY['Jalapeños', 'Cebolla Roja', 'Tomate', 'Queso Edam', 'Carne 100% ternera asturiana', 'Salsa de Yogur', 'Lechuga'], false, '/images/burgers/oikos.png'
FROM public.categories WHERE slug = 'hamburguesas';

INSERT INTO public.products (category_id, name, price, ingredients, is_featured)
SELECT id, 'Cielito Lindo', 12.00, ARRAY['Cebolla Roja', 'Jalapeños', 'Aguacate', 'Tomate', 'Bacon', 'Queso', 'Carne 100% Ternera Asturiana', 'Lechuga'], false
FROM public.categories WHERE slug = 'hamburguesas';

INSERT INTO public.products (category_id, name, price, ingredients, is_featured)
SELECT id, 'Everest', 12.00, ARRAY['Pan americano', 'Pimientos Asados', 'Mermelada Bacon & Mayo Bacon', 'Bacon', 'Queso Cheddar', 'Cebolla Roja', 'Carne 100% Ternera Asturiana', 'Lechuga'], false
FROM public.categories WHERE slug = 'hamburguesas';

INSERT INTO public.products (category_id, name, price, ingredients, is_featured)
SELECT id, 'Escorpión', 12.00, ARRAY['Pimientos asados', 'Salsa picante', 'Jamón serrano', 'Tomate', 'Queso cheddar', 'Carne 100% ternera asturiana', 'Lechuga'], false
FROM public.categories WHERE slug = 'hamburguesas';

-- SANDWICHES
INSERT INTO public.products (category_id, name, price, ingredients)
SELECT id, 'Sandwich Pozu', 8.00, ARRAY['Huevo', 'Lechuga', 'Tomate', 'Salsa americana de mostaza suave', 'Bacon', 'Jamón York', 'Queso']
FROM public.categories WHERE slug = 'sandwiches';

-- PATATAS
INSERT INTO public.products (category_id, name, price, description)
SELECT id, 'Patatas Pozu', 9.00, 'Patatas al horno con salsa ranchera, quesos, bacon crujiente y jalapeños'
FROM public.categories WHERE slug = 'patatas';

INSERT INTO public.products (category_id, name, price, description)
SELECT id, 'Cuatro Salsas', 8.50, 'Patatas con cuatro salsas: Miel y mostaza, Ketchup, Brava, Alioli'
FROM public.categories WHERE slug = 'patatas';

-- PARA PICAR
INSERT INTO public.products (category_id, name, price, description)
SELECT id, 'Nachos Pozu', 12.00, 'Nachos con Carne y Queso Crema'
FROM public.categories WHERE slug = 'para-picar';

INSERT INTO public.products (category_id, name, price, description)
SELECT id, 'Tequeños', 8.00, '6 unidades + Salsa'
FROM public.categories WHERE slug = 'para-picar';
