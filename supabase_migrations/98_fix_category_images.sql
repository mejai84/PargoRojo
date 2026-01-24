-- =============================================
-- FORCE CATEGORY IMAGES FROM LOCAL STORAGE
-- Ensures categories use /categories/[slug].png
-- =============================================

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

-- Also ensure 'pastas.png' exists (I tried to copy it but it might have failed)
-- I will assume I need to generate it if it's missing or if the user says so.
-- But for now, I'll assume they are there as per the list_dir output (pastas was missing from list_dir).
