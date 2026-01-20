-- =========================================================
-- PARTE 1: LIMPIEZA Y PRIMERAS CATEGORÍAS
-- Copiar y pegar ESTE BLOQUE y dar click en RUN
-- =========================================================

TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.products CASCADE;
TRUNCATE TABLE public.categories CASCADE;

DO $$
DECLARE
  cat_id UUID;
BEGIN
  -- 1. PESCADOS Y MARISCOS
  INSERT INTO public.categories (name, slug, order_position, is_active) VALUES ('Pescados y Mariscos', 'pescados-y-mariscos', 1, true) RETURNING id INTO cat_id;
  INSERT INTO public.products (category_id, name, price, description) VALUES
  (cat_id, 'Cazuela de Mariscos', 62000, ''),
  (cat_id, 'Cazuela de Mariscos Gratinada', 68000, ''),
  (cat_id, 'Filete de Róbalo o Pargo a la Plancha', 50000, ''),
  (cat_id, 'Filete de Róbalo o Pargo a la Brasa', 50000, ''),
  (cat_id, 'Filete de Róbalo o Pargo a la Milanesa', 55000, ''),
  (cat_id, 'Filete de Róbalo o Pargo Gratinado', 65000, ''),
  (cat_id, 'Filete de Róbalo o Pargo en salsa de Champiñones', 65000, ''),
  (cat_id, 'Filete de Róbalo o Pargo en Salsa de Camarón', 72000, ''),
  (cat_id, 'Filete de Róbalo o Pargo Submarino 7 Mares', 75000, ''),
  (cat_id, 'Pargo Rojo Frito', 0, 'Precio según tamaño'),
  (cat_id, 'Pargo Rojo Sudado', 0, 'Precio según tamaño'),
  (cat_id, 'Sierra Frita', 0, 'Precio según tamaño'),
  (cat_id, 'Sierra Sudada', 0, 'Precio según tamaño'),
  (cat_id, 'Róbalo Entero', 0, 'Precio según tamaño'),
  (cat_id, 'Pulpo al Ajillo', 52000, ''),
  (cat_id, 'Langostino a la Brasa', 62000, ''),
  (cat_id, 'Langostino al Ajillo', 68000, ''),
  (cat_id, 'Langostino a la Milanesa', 70000, ''),
  (cat_id, 'Langostino 7 Mares Submarino', 80000, ''),
  (cat_id, 'Salmón a la Plancha', 50000, ''),
  (cat_id, 'Salmón al Ajillo', 56000, ''),
  (cat_id, 'Salmón en Salsa de Champiñones', 62000, ''),
  (cat_id, 'Salmón en salsa de Camarones', 72000, ''),
  (cat_id, 'Salmón en Salsa de Marisco', 75000, ''),
  (cat_id, 'Camarón a la Milanesa', 65000, ''),
  (cat_id, 'Camarón al Ajillo', 70000, ''),
  (cat_id, 'Camarón Gratinado', 68000, '');

  -- 2. RICURAS DE NUESTRA REGIÓN
  INSERT INTO public.categories (name, slug, order_position, is_active) VALUES ('Ricuras de nuestra Región', 'ricuras-region', 2, true) RETURNING id INTO cat_id;
  INSERT INTO public.products (category_id, name, price, description) VALUES
  (cat_id, 'Ensopado de Bagre', 52000, ''),
  (cat_id, 'Ensopado de Bagre a la Marinera', 58000, ''),
  (cat_id, 'Bagre a la Plancha', 44000, ''),
  (cat_id, 'Bagre a la Brasa', 44000, ''),
  (cat_id, 'Bagre a la Milanesa', 47000, ''),
  (cat_id, 'Bagre Medallón Frito', 42000, ''),
  (cat_id, 'Bagre a la Criolla', 47000, ''),
  (cat_id, 'Bagre Gratinado', 56000, ''),
  (cat_id, 'Bagre en Salsa de Mariscos', 60000, ''),
  (cat_id, 'Bagre en Salsa de Champiñones', 55000, ''),
  (cat_id, 'Bagre en Salsa de Langostinos', 78000, ''),
  (cat_id, 'Bocachico Frito', 0, 'Precio según tamaño'),
  (cat_id, 'Cachama Frita', 0, 'Precio según tamaño'),
  (cat_id, 'Tilapia Frito', 0, 'Precio según tamaño');
END $$;

-- =========================================================
-- PARTE 2: CARNES Y ARROCES
-- (Borra lo anterior y pega esto si tu editor es lento, o pega todo junto si deja)
-- =========================================================
DO $$
DECLARE
  cat_id UUID;
BEGIN
  -- 3. CORTES GRUESOS
  INSERT INTO public.categories (name, slug, order_position, is_active) VALUES ('Cortes Gruesos', 'cortes-gruesos', 3, true) RETURNING id INTO cat_id;
  INSERT INTO public.products (category_id, name, price, description) VALUES
  (cat_id, 'Churrasco Argentino', 42000, ''),
  (cat_id, 'Churrasco a la Italiana', 48000, ''),
  (cat_id, 'Churrasco al Caballo', 48000, ''),
  (cat_id, 'Churrasco al Ajo', 47000, ''),
  (cat_id, 'Churrasco de Punta de Anca', 50000, ''),
  (cat_id, 'Churrasco de Solomito', 50000, ''),
  (cat_id, 'Churrasco a la Mexicana', 48000, '');

  -- 4. ESPECIALIDADES A LA BRASA
  INSERT INTO public.categories (name, slug, order_position, is_active) VALUES ('Especialidades a la Brasa', 'especialidades-brasa', 4, true) RETURNING id INTO cat_id;
  INSERT INTO public.products (category_id, name, price, description) VALUES
  (cat_id, 'Lengua a la Brasa', 40000, ''),
  (cat_id, 'Lengua a la Criolla', 46000, ''),
  (cat_id, 'Lengua en Salsa de Champiñones', 46000, ''),
  (cat_id, 'Lengua al Ajillo', 44000, ''),
  (cat_id, 'Sobrebarriga a la Brasa', 42000, ''),
  (cat_id, 'Picada a la Carri', 75000, ''),
  (cat_id, 'Super Parrilla', 75000, '');

  -- 5. CERDO
  INSERT INTO public.categories (name, slug, order_position, is_active) VALUES ('Cerdo', 'cerdo', 5, true) RETURNING id INTO cat_id;
  INSERT INTO public.products (category_id, name, price, description) VALUES
  (cat_id, 'Gran Rafa de Cerdo', 30000, ''),
  (cat_id, 'Cañón de Cerdo', 38000, ''),
  (cat_id, 'Super Costilla BBQ', 40000, ''),
  (cat_id, 'Chuleta de Cerdo a la Brasa', 38000, ''),
  (cat_id, 'Lomito de Cerdo a la Milanesa', 35000, ''),
  (cat_id, 'Lomito de Cerdo en Salsa de Champiñones', 38000, '');
  
    -- 6. ARROCES
  INSERT INTO public.categories (name, slug, order_position, is_active) VALUES ('Arroces', 'arroces', 6, true) RETURNING id INTO cat_id;
  INSERT INTO public.products (category_id, name, price, description) VALUES
  (cat_id, 'Arroz con Pollo y Verduras', 35000, ''),
  (cat_id, 'Arroz con Cerdo', 37000, ''),
  (cat_id, 'Arroz Oriental', 40000, ''),
  (cat_id, 'Arroz Cubano', 40000, ''),
  (cat_id, 'Arroz a la Marinera', 48000, ''),
  (cat_id, 'Arroz con Camarón', 48000, '');
END $$;

-- =========================================================
-- PARTE 3: POLLOS, PASTAS Y TRADICIONAL
-- =========================================================
DO $$
DECLARE
  cat_id UUID;
BEGIN
  -- 7. POLLOS
  INSERT INTO public.categories (name, slug, order_position, is_active) VALUES ('Pollos', 'pollos', 7, true) RETURNING id INTO cat_id;
  INSERT INTO public.products (category_id, name, price, description) VALUES
  (cat_id, 'Pechuga a la Brasa Deshuesada', 34000, ''),
  (cat_id, 'Pollo a la Milanesa', 38000, ''),
  (cat_id, 'Filete de Pollo a la Milanesa', 38000, ''),
  (cat_id, 'Pollo Hawaiano', 40000, ''),
  (cat_id, 'Pollo Gratinado Tres Quesos', 43000, ''),
  (cat_id, 'Pollo a la Italiana', 43000, ''),
  (cat_id, 'Pollo en Salsa de Champiñones', 40000, ''),
  (cat_id, 'Pollo al Ajillo', 40000, ''),
  (cat_id, 'Pollo Agridulce', 38000, '');

  -- 8. PASTAS
  INSERT INTO public.categories (name, slug, order_position, is_active) VALUES ('Pastas', 'pastas', 8, true) RETURNING id INTO cat_id;
  INSERT INTO public.products (category_id, name, price, description) VALUES
  (cat_id, 'Napolitana', 26000, ''),
  (cat_id, 'Boloñesa', 30000, ''),
  (cat_id, 'Pollo', 32000, ''),
  (cat_id, 'Carbonara', 33000, ''),
  (cat_id, 'Champiñones', 33000, ''),
  (cat_id, 'Camarones', 40000, ''),
  (cat_id, '7 Mares', 40000, '');

  -- 9. COMIDA MONTAÑERA
  INSERT INTO public.categories (name, slug, order_position, is_active) VALUES ('Comida Montañera', 'comida-montanera', 9, true) RETURNING id INTO cat_id;
  INSERT INTO public.products (category_id, name, price, description) VALUES
  (cat_id, 'Bandeja Paisa', 42000, ''),
  (cat_id, 'Cazuela de Frijol', 33000, ''),
  (cat_id, 'Arriero', 35000, ''),
  (cat_id, 'Cazuela Gran Rafa', 36000, ''),
  (cat_id, 'Cazuela Mexicana', 36000, ''),
  (cat_id, 'Chicharronada', 40000, '');
  
    -- 10. LASAÑAS
  INSERT INTO public.categories (name, slug, order_position, is_active) VALUES ('Lasañas', 'lasanas', 10, true) RETURNING id INTO cat_id;
  INSERT INTO public.products (category_id, name, price, description) VALUES
  (cat_id, 'Res', 28000, ''),
  (cat_id, 'Pollo', 28000, ''),
  (cat_id, 'Mixta', 32000, ''),
  (cat_id, 'Especial', 36000, '');
END $$;

-- =========================================================
-- PARTE 4: RESTO DEL MENÚ
-- =========================================================
DO $$
DECLARE
  cat_id UUID;
BEGIN
  -- 11. COMIDAS RÁPIDAS
  INSERT INTO public.categories (name, slug, order_position, is_active) VALUES ('Comidas Rápidas', 'comidas-rapidas', 11, true) RETURNING id INTO cat_id;
  INSERT INTO public.products (category_id, name, price, description) VALUES
  (cat_id, 'SalchiPapas', 17000, ''),
  (cat_id, 'SalchiPollos', 20000, ''),
  (cat_id, 'SalchiCarne', 20000, ''),
  (cat_id, 'SalchiRanchera', 20000, ''),
  (cat_id, 'Hamburguesa Sencilla', 22000, ''),
  (cat_id, 'Hamburguesa Doble', 25000, ''),
  (cat_id, 'Hamburguesa de la Casa', 30000, '');

  -- 12. MENÚ INFANTIL
  INSERT INTO public.categories (name, slug, order_position, is_active) VALUES ('Menú Infantil', 'menu-infantil', 12, true) RETURNING id INTO cat_id;
  INSERT INTO public.products (category_id, name, price, description) VALUES
  (cat_id, 'Nugets de Pollo', 24000, 'Guarnición: Papitas a la francesa'),
  (cat_id, 'Planchita de Pollo (Pechuga)', 24000, 'Guarnición: Papitas a la francesa'),
  (cat_id, 'Baby Beef Junior', 24000, 'Guarnición: Papitas a la francesa'),
  (cat_id, 'Filete de Pollo a la Milanesa', 24000, 'Guarnición: Papitas a la francesa'),
  (cat_id, 'Churrasquito Argentino', 24000, 'Guarnición: Papitas a la francesa');

  -- 13. ENTRADAS
  INSERT INTO public.categories (name, slug, order_position, is_active) VALUES ('Entradas', 'entradas', 13, true) RETURNING id INTO cat_id;
  INSERT INTO public.products (category_id, name, price, description) VALUES
  (cat_id, 'Crema de Cebolla', 15000, ''),
  (cat_id, 'Crema de Pollo', 15000, ''),
  (cat_id, 'Crema de Champiñones', 16000, ''),
  (cat_id, 'Crema de Camarón', 24000, ''),
  (cat_id, 'Crema de Camarón Gran Rafa', 25000, ''),
  (cat_id, 'Patacón con Suero', 16000, ''),
  (cat_id, 'Patacón con Hogao', 16000, ''),
  (cat_id, 'Yuca frita con Suero', 16000, ''),
  (cat_id, 'Yuca Frita con Hogao', 16000, ''),
  (cat_id, 'Platanitos Chips con Suero', 16000, ''),
  (cat_id, 'Platanitos Chips con Hogao', 18000, '');

  -- 14. ASADOS
  INSERT INTO public.categories (name, slug, order_position, is_active) VALUES ('Asados', 'asados', 14, true) RETURNING id INTO cat_id;
  INSERT INTO public.products (category_id, name, price, description) VALUES
  (cat_id, 'Carne Gran Rafa de Res', 33000, ''),
  (cat_id, 'Punta de Anca Mediana', 42000, ''),
  (cat_id, 'Punta de Anca Especial', 45000, ''),
  (cat_id, 'Baby Beef (Solomito fino 400gr)', 44000, ''),
  (cat_id, 'Solomito Hawaiano', 40000, ''),
  (cat_id, 'Solomito a la Pimienta', 40000, ''),
  (cat_id, 'Solomito Gratinado de tres Quesos', 42000, ''),
  (cat_id, 'Solomito en Salsa de Champiñones', 42000, ''),
  (cat_id, 'Fillet Mignon', 45000, ''),
  (cat_id, 'Steak Pimienta', 45000, '');

  -- 15. DESAYUNOS
  INSERT INTO public.categories (name, slug, order_position, is_active) VALUES ('Desayunos', 'desayunos', 15, true) RETURNING id INTO cat_id;
  INSERT INTO public.products (category_id, name, price, description) VALUES
  (cat_id, 'CALENTADO CON HUEVOS (PATACONES)', 17500, ''),
  (cat_id, 'CALENTADO CON HUEVOS (AREPA)', 15500, ''),
  (cat_id, 'CALENTADO CON RES, CERDO O PECHUGA (PATACONES)', 19500, ''),
  (cat_id, 'CALENTADO CON RES, CERDO O PECHUGA (AREPA)', 18000, ''),
  (cat_id, 'HUEVOS RANCHEROS (PATACONES)', 19500, ''),
  (cat_id, 'HUEVOS REVUELTOS CON O SIN ALIÑOS (PATACONES)', 18500, ''),
  (cat_id, 'HUEVOS REVUELTOS CON O SIN ALIÑOS (AREPA)', 13000, ''),
  (cat_id, 'HUEVOS A LA CACEROLA / FRITO (PATACONES)', 14500, ''),
  (cat_id, 'HUEVOS A LA CACEROLA / FRITO (AREPA)', 12500, ''),
  (cat_id, 'CARNE DE RES O CERDO AL BISTEC', 19500, 'PAPA O YUCA AL VAPOR'),
  (cat_id, 'CALENTADO CON CHICHARRON PATACONES', 22500, ''),
  (cat_id, 'OMELETTE', 19500, '');

  -- 16. ADICIONALES Y BEBIDA
  INSERT INTO public.categories (name, slug, order_position, is_active) VALUES ('Adicionales y Bebida', 'adicionales-bebida', 16, true) RETURNING id INTO cat_id;
  INSERT INTO public.products (category_id, name, price, description) VALUES
  (cat_id, 'HUEVOS REVUELTOS', 8000, ''),
  (cat_id, 'CALENTADO', 4000, ''),
  (cat_id, 'PATACONES X 4', 4000, ''),
  (cat_id, 'AREPA TELA', 1500, ''),
  (cat_id, 'QUESO COSTEÑO', 4000, ''),
  (cat_id, 'QUESO MOZARELLA', 3500, ''),
  (cat_id, 'PAN', 1500, ''),
  (cat_id, 'CHOCOLATE', 4500, ''),
  (cat_id, 'CAFÉ CON LECHE', 4500, ''),
  (cat_id, 'TINTO', 1500, ''),
  (cat_id, 'AROMÁTICA', 10000, ''),
  (cat_id, 'MILO FRIO', 6000, ''),
  (cat_id, 'MILO CALIENTE', 6000, '');

  UPDATE public.products SET is_available = true, deleted_at = NULL;
  UPDATE public.categories SET is_active = true, deleted_at = NULL;
END $$;
