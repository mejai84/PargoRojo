-- =========================================================
-- MASTER SEED: PARGO ROJO GRAN RAFA
-- Este script borra todo y carga la carta completa proporcionada
-- =========================================================

-- 1. Limpieza total
TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.products CASCADE;
TRUNCATE TABLE public.categories CASCADE;

DO $$
DECLARE 
    cat_id UUID;
BEGIN
    -- 1. PESCADOS Y MARISCOS
    INSERT INTO public.categories (name, slug, order_position, is_active) 
    VALUES ('Pescados y Mariscos', 'pescados-y-mariscos', 1, true)
    ON CONFLICT (slug) DO UPDATE SET is_active = true RETURNING id INTO cat_id;
    
    INSERT INTO public.products (category_id, name, price, description, is_available) VALUES
    (cat_id, 'Cazuela de Mariscos', 62000, '', true),
    (cat_id, 'Cazuela de Mariscos Gratinada', 68000, '', true),
    (cat_id, 'Filete de Róbalo o Pargo a la Plancha', 50000, '', true),
    (cat_id, 'Filete de Róbalo o Pargo a la Brasa', 50000, '', true),
    (cat_id, 'Filete de Róbalo o Pargo a la Milanesa', 55000, '', true),
    (cat_id, 'Filete de Róbalo o Pargo Gratinado', 65000, '', true),
    (cat_id, 'Filete de Róbalo o Pargo en salsa de Champiñones', 65000, '', true),
    (cat_id, 'Filete de Róbalo o Pargo en Salsa de Camarón', 72000, '', true),
    (cat_id, 'Filete de Róbalo o Pargo Submarino 7 Mares', 75000, '', true),
    (cat_id, 'Pargo Rojo Frito', 0, 'Precio según tamaño', true),
    (cat_id, 'Pargo Rojo Sudado', 0, 'Precio según tamaño', true),
    (cat_id, 'Sierra Frita', 0, 'Precio según tamaño', true),
    (cat_id, 'Sierra Sudada', 0, 'Precio según tamaño', true),
    (cat_id, 'Róbalo Entero', 0, 'Precio según tamaño', true),
    (cat_id, 'Pulpo al Ajillo', 52000, '', true),
    (cat_id, 'Langostino a la Brasa', 62000, '', true),
    (cat_id, 'Langostino al Ajillo', 68000, '', true),
    (cat_id, 'Langostino a la Milanesa', 70000, '', true),
    (cat_id, 'Langostino 7 Mares Submarino', 80000, '', true),
    (cat_id, 'Salmón a la Plancha', 50000, '', true),
    (cat_id, 'Salmón al Ajillo', 56000, '', true),
    (cat_id, 'Salmón en Salsa de Champiñones', 62000, '', true),
    (cat_id, 'Salmón en salsa de Camarones', 72000, '', true),
    (cat_id, 'Salmón en Salsa de Marisco', 75000, '', true),
    (cat_id, 'Camarón a la Milanesa', 65000, '', true),
    (cat_id, 'Camarón al Ajillo', 70000, '', true),
    (cat_id, 'Camarón Gratinado', 68000, '', true);

    -- 2. RICURAS DE NUESTRA REGIÓN
    INSERT INTO public.categories (name, slug, order_position, is_active) 
    VALUES ('Ricuras de nuestra Región', 'ricuras-region', 2, true)
    ON CONFLICT (slug) DO UPDATE SET is_active = true RETURNING id INTO cat_id;
    
    INSERT INTO public.products (category_id, name, price, description, is_available) VALUES
    (cat_id, 'Ensopado de Bagre', 52000, '', true),
    (cat_id, 'Ensopado de Bagre a la Marinera', 58000, '', true),
    (cat_id, 'Bagre a la Plancha', 44000, '', true),
    (cat_id, 'Bagre a la Brasa', 44000, '', true),
    (cat_id, 'Bagre a la Milanesa', 47000, '', true),
    (cat_id, 'Bagre Medallón Frito', 42000, '', true),
    (cat_id, 'Bagre a la Criolla', 47000, '', true),
    (cat_id, 'Bagre Gratinado', 56000, '', true),
    (cat_id, 'Bagre en Salsa de Mariscos', 60000, '', true),
    (cat_id, 'Bagre en Salsa de Champiñones', 55000, '', true),
    (cat_id, 'Bagre en Salsa de Langostinos', 78000, '', true),
    (cat_id, 'Bocachico Frito', 0, 'Precio según tamaño', true),
    (cat_id, 'Cachama Frita', 0, 'Precio según tamaño', true),
    (cat_id, 'Tilapia Frita', 0, 'Precio según tamaño', true);

    -- 3. CORTES GRUESOS
    INSERT INTO public.categories (name, slug, order_position, is_active) 
    VALUES ('Cortes Gruesos', 'cortes-gruesos', 3, true)
    ON CONFLICT (slug) DO UPDATE SET is_active = true RETURNING id INTO cat_id;
    
    INSERT INTO public.products (category_id, name, price, is_available) VALUES
    (cat_id, 'Churrasco Argentino', 42000, true),
    (cat_id, 'Churrasco a la Italiana', 48000, true),
    (cat_id, 'Churrasco al Caballo', 48000, true),
    (cat_id, 'Churrasco al Ajo', 47000, true),
    (cat_id, 'Churrasco de Punta de Anca', 50000, true),
    (cat_id, 'Churrasco de Solomito', 50000, true),
    (cat_id, 'Churrasco a la Mexicana', 48000, true);

    -- 4. ESPECIALIDADES A LA BRASA
    INSERT INTO public.categories (name, slug, order_position, is_active) 
    VALUES ('Especialidades a la Brasa', 'especialidades-brasa', 4, true)
    ON CONFLICT (slug) DO UPDATE SET is_active = true RETURNING id INTO cat_id;
    
    INSERT INTO public.products (category_id, name, price, is_available) VALUES
    (cat_id, 'Lengua a la Brasa', 40000, true),
    (cat_id, 'Lengua a la Criolla', 46000, true),
    (cat_id, 'Lengua en Salsa de Champiñones', 46000, true),
    (cat_id, 'Lengua al Ajillo', 44000, true),
    (cat_id, 'Sobrebarriga a la Brasa', 42000, true),
    (cat_id, 'Picada a la Carri', 75000, true),
    (cat_id, 'Super Parrilla', 75000, true);

    -- 5. CERDO
    INSERT INTO public.categories (name, slug, order_position, is_active) 
    VALUES ('Cerdo', 'cerdo', 5, true)
    ON CONFLICT (slug) DO UPDATE SET is_active = true RETURNING id INTO cat_id;
    
    INSERT INTO public.products (category_id, name, price, is_available) VALUES
    (cat_id, 'Gran Rafa de Cerdo', 30000, true),
    (cat_id, 'Cañón de Cerdo', 38000, true),
    (cat_id, 'Super Costilla BBQ', 40000, true),
    (cat_id, 'Chuleta de Cerdo a la Brasa', 38000, true),
    (cat_id, 'Lomito de Cerdo a la Milanesa', 35000, true),
    (cat_id, 'Lomito de Cerdo en Salsa de Champiñones', 38000, true);

    -- 6. ARROCES
    INSERT INTO public.categories (name, slug, order_position, is_active) 
    VALUES ('Arroces', 'arroces', 6, true)
    ON CONFLICT (slug) DO UPDATE SET is_active = true RETURNING id INTO cat_id;
    
    INSERT INTO public.products (category_id, name, price, is_available) VALUES
    (cat_id, 'Arroz con Pollo y Verduras', 35000, true),
    (cat_id, 'Arroz con Cerdo', 37000, true),
    (cat_id, 'Arroz Oriental', 40000, true),
    (cat_id, 'Arroz Cubano', 40000, true),
    (cat_id, 'Arroz a la Marinera', 48000, true),
    (cat_id, 'Arroz con Camarón', 48000, true);

    -- 7. POLLOS
    INSERT INTO public.categories (name, slug, order_position, is_active) 
    VALUES ('Pollos', 'pollos', 7, true)
    ON CONFLICT (slug) DO UPDATE SET is_active = true RETURNING id INTO cat_id;
    
    INSERT INTO public.products (category_id, name, price, is_available) VALUES
    (cat_id, 'Pechuga a la Brasa Deshuesada', 34000, true),
    (cat_id, 'Pollo a la Milanesa', 38000, true),
    (cat_id, 'Filete de Pollo a la Milanesa', 38000, true),
    (cat_id, 'Pollo Hawaiano', 40000, true),
    (cat_id, 'Pollo Gratinado Tres Quesos', 43000, true),
    (cat_id, 'Pollo a la Italiana', 43000, true),
    (cat_id, 'Pollo en Salsa de Champiñones', 40000, true),
    (cat_id, 'Pollo al Ajillo', 40000, true),
    (cat_id, 'Pollo Agridulce', 38000, true);

    -- 8. PASTAS
    INSERT INTO public.categories (name, slug, order_position, is_active) 
    VALUES ('Pastas', 'pastas', 8, true)
    ON CONFLICT (slug) DO UPDATE SET is_active = true RETURNING id INTO cat_id;
    
    INSERT INTO public.products (category_id, name, price, is_available) VALUES
    (cat_id, 'Napolitana', 26000, true),
    (cat_id, 'Boloñesa', 30000, true),
    (cat_id, 'Pollo', 32000, true),
    (cat_id, 'Carbonara', 33000, true),
    (cat_id, 'Champiñones', 33000, true),
    (cat_id, 'Camarones', 40000, true),
    (cat_id, '7 Mares', 40000, true);

    -- 9. COMIDA MONTAÑERA
    INSERT INTO public.categories (name, slug, order_position, is_active) 
    VALUES ('Comida Montañera', 'comida-montanera', 9, true)
    ON CONFLICT (slug) DO UPDATE SET is_active = true RETURNING id INTO cat_id;
    
    INSERT INTO public.products (category_id, name, price, is_available) VALUES
    (cat_id, 'Bandeja Paisa', 42000, true),
    (cat_id, 'Cazuela de Frijol', 33000, true),
    (cat_id, 'Arriero', 35000, true),
    (cat_id, 'Cazuela Gran Rafa', 36000, true),
    (cat_id, 'Cazuela Mexicana', 36000, true),
    (cat_id, 'Chicharronada', 40000, true);

    -- 10. LASAÑAS
    INSERT INTO public.categories (name, slug, order_position, is_active) 
    VALUES ('Lasañas', 'lasanas', 10, true)
    ON CONFLICT (slug) DO UPDATE SET is_active = true RETURNING id INTO cat_id;
    
    INSERT INTO public.products (category_id, name, price, is_available) VALUES
    (cat_id, 'Res', 28000, true),
    (cat_id, 'Pollo', 28000, true),
    (cat_id, 'Mixta', 32000, true),
    (cat_id, 'Especial', 36000, true);

    -- 11. COMIDAS RÁPIDAS
    INSERT INTO public.categories (name, slug, order_position, is_active) 
    VALUES ('Comidas Rápidas', 'comidas-rapidas', 11, true)
    ON CONFLICT (slug) DO UPDATE SET is_active = true RETURNING id INTO cat_id;
    
    INSERT INTO public.products (category_id, name, price, is_available) VALUES
    (cat_id, 'SalchiPapas', 17000, true),
    (cat_id, 'SalchiPollos', 20000, true),
    (cat_id, 'SalchiCarne', 20000, true),
    (cat_id, 'SalchiRanchera', 20000, true),
    (cat_id, 'Hamburguesa Sencilla', 22000, true),
    (cat_id, 'Hamburguesa Doble', 25000, true),
    (cat_id, 'Hamburguesa de la Casa', 30000, true);

    -- 12. MENÚ INFANTIL
    INSERT INTO public.categories (name, slug, order_position, is_active) 
    VALUES ('Menú Infantil', 'menu-infantil', 12, true)
    ON CONFLICT (slug) DO UPDATE SET is_active = true RETURNING id INTO cat_id;
    
    INSERT INTO public.products (category_id, name, price, description, is_available) VALUES
    (cat_id, 'Nugets de Pollo', 24000, 'Guarnición: Papitas a la francesa', true),
    (cat_id, 'Planchita de Pollo (Pechuga)', 24000, 'Guarnición: Papitas a la francesa', true),
    (cat_id, 'Baby Beef Junior', 24000, 'Guarnición: Papitas a la francesa', true),
    (cat_id, 'Filete de Pollo a la Milanesa', 24000, 'Guarnición: Papitas a la francesa', true),
    (cat_id, 'Churrasquito Argentino', 24000, 'Guarnición: Papitas a la francesa', true);

    -- 13. ENTRADAS
    INSERT INTO public.categories (name, slug, order_position, is_active) 
    VALUES ('Entradas', 'entradas', 13, true)
    ON CONFLICT (slug) DO UPDATE SET is_active = true RETURNING id INTO cat_id;
    
    INSERT INTO public.products (category_id, name, price, is_available) VALUES
    (cat_id, 'Crema de Cebolla', 15000, true),
    (cat_id, 'Crema de Pollo', 15000, true),
    (cat_id, 'Crema de Champiñones', 16000, true),
    (cat_id, 'Crema de Camarón', 24000, true),
    (cat_id, 'Crema de Camarón Gran Rafa', 25000, true),
    (cat_id, 'Patacón con Suero', 16000, true),
    (cat_id, 'Patacón con Hogao', 16000, true),
    (cat_id, 'Yuca frita con Suero', 16000, true),
    (cat_id, 'Yuca Frita con Hogao', 16000, true),
    (cat_id, 'Platanitos Chips con Suero', 16000, true),
    (cat_id, 'Platanitos Chips con Hogao', 18000, true);

    -- 14. ASADOS
    INSERT INTO public.categories (name, slug, order_position, is_active) 
    VALUES ('Asados', 'asados', 14, true)
    ON CONFLICT (slug) DO UPDATE SET is_active = true RETURNING id INTO cat_id;
    
    INSERT INTO public.products (category_id, name, price, is_available) VALUES
    (cat_id, 'Carne Gran Rafa de Res', 33000, true),
    (cat_id, 'Punta de Anca Mediana', 42000, true),
    (cat_id, 'Punta de Anca Especial', 45000, true),
    (cat_id, 'Baby Beef (Solomito fino 400gr)', 44000, true),
    (cat_id, 'Solomito Hawaiano', 40000, true),
    (cat_id, 'Solomito a la Pimienta', 40000, true),
    (cat_id, 'Solomito Gratinado de tres Quesos', 42000, true),
    (cat_id, 'Solomito en Salsa de Champiñones', 42000, true),
    (cat_id, 'Fillet Mignon', 45000, true),
    (cat_id, 'Steak Pimienta', 45000, true);

    -- 15. DESAYUNOS
    INSERT INTO public.categories (name, slug, order_position, is_active) 
    VALUES ('Desayunos', 'desayunos', 15, true)
    ON CONFLICT (slug) DO UPDATE SET is_active = true RETURNING id INTO cat_id;
    
    INSERT INTO public.products (category_id, name, price, is_available) VALUES
    (cat_id, 'CALENTADO CON HUEVOS PATACONES', 17500, true),
    (cat_id, 'CALENTADO CON HUEVOS AREPA', 15500, true),
    (cat_id, 'CALENTADO CON RES, CERDO O PECHUGA PATACONES', 19500, true),
    (cat_id, 'CALENTADO CON RES, CERDO O PECHUGA AREPA', 18000, true),
    (cat_id, 'HUEVOS RANCHEROS PATACONES', 19500, true),
    (cat_id, 'HUEVOS REVUELTOS CON O SIN ALIÑOS PATACONES', 18500, true),
    (cat_id, 'HUEVOS REVUELTOS CON O SIN ALIÑOS AREPA', 13000, true),
    (cat_id, 'HUEVOS A LA CACEROLA (FRITO) PATACONES', 14500, true),
    (cat_id, 'HUEVOS A LA CACEROLA (FRITO) AREPA', 12500, true),
    (cat_id, 'CARNE DE RES O CERDO AL BISTEC PAPA O YUCA AL VAPOR', 19500, true),
    (cat_id, 'CALENTADO CON CHICHARRON PATACONES', 22500, true),
    (cat_id, 'OMELETTE', 19500, true);

    -- 16. ADICIONALES Y BEBIDAS
    INSERT INTO public.categories (name, slug, order_position, is_active) 
    VALUES ('Adicionales y Bebidas', 'adicionales-bebidas', 16, true)
    ON CONFLICT (slug) DO UPDATE SET is_active = true RETURNING id INTO cat_id;
    
    INSERT INTO public.products (category_id, name, price, is_available) VALUES
    (cat_id, 'HUEVOS REVUELTOS', 8000, true),
    (cat_id, 'CALENTADO', 4000, true),
    (cat_id, 'PATACONES X 4', 4000, true),
    (cat_id, 'AREPA TELA', 1500, true),
    (cat_id, 'QUESO COSTEÑO', 4000, true),
    (cat_id, 'QUESO MOZARELLA', 3500, true),
    (cat_id, 'PAN', 1500, true),
    (cat_id, 'CHOCOLATE', 4500, true),
    (cat_id, 'CAFÉ CON LECHE', 4500, true),
    (cat_id, 'TINTO', 1500, true),
    (cat_id, 'AROMÁTICA', 1500, true),
    (cat_id, 'MILO FRIO', 10000, true),
    (cat_id, 'MILO CALIENTE', 6000, true);

    -- ACTIVACIÓN TOTAL
    UPDATE public.products SET is_available = true;
    UPDATE public.categories SET is_active = true;
END $$;
