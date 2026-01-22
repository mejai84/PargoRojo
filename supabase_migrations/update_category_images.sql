-- Actualizar imágenes de categorías apuntando a la carpeta local /categories
-- Se asume que las imágenes ya están en public/categories/

UPDATE public.categories SET image_url = '/categories/pescados-y-mariscos.png' WHERE slug = 'pescados-y-mariscos';
UPDATE public.categories SET image_url = '/categories/ricuras-region.png' WHERE slug = 'ricuras-region';
UPDATE public.categories SET image_url = '/categories/cortes-gruesos.png' WHERE slug = 'cortes-gruesos';
UPDATE public.categories SET image_url = '/categories/especialidades-brasa.png' WHERE slug = 'especialidades-brasa';
UPDATE public.categories SET image_url = '/categories/cerdo.png' WHERE slug = 'cerdo';
UPDATE public.categories SET image_url = '/categories/arroces.png' WHERE slug = 'arroces';
UPDATE public.categories SET image_url = '/categories/pollos.png' WHERE slug = 'pollos';
UPDATE public.categories SET image_url = '/categories/pastas.png' WHERE slug = 'pastas';
UPDATE public.categories SET image_url = '/categories/comida-montanera.png' WHERE slug = 'comida-montanera';
UPDATE public.categories SET image_url = '/categories/lasanas.png' WHERE slug = 'lasanas';
UPDATE public.categories SET image_url = '/categories/comidas-rapidas.png' WHERE slug = 'comidas-rapidas';
UPDATE public.categories SET image_url = '/categories/menu-infantil.png' WHERE slug = 'menu-infantil';
UPDATE public.categories SET image_url = '/categories/entradas.png' WHERE slug = 'entradas';
UPDATE public.categories SET image_url = '/categories/asados.png' WHERE slug = 'asados';
UPDATE public.categories SET image_url = '/categories/desayunos.png' WHERE slug = 'desayunos';
UPDATE public.categories SET image_url = '/categories/adicionales-bebidas.png' WHERE slug = 'adicionales-bebidas';
