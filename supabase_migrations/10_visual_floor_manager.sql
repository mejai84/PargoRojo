-- =============================================
-- VISUAL FLOOR MANAGER - DATABASE EXTENSION
-- Adds spatial properties to tables for 2D mapping
-- =============================================

ALTER TABLE public.tables 
ADD COLUMN IF NOT EXISTS x_pos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS y_pos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS rotation INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shape TEXT DEFAULT 'rectangle' CHECK (shape IN ('rectangle', 'circle', 'square'));

-- Update existing tables with a default grid layout so they are visible
UPDATE public.tables SET x_pos = 50, y_pos = 50 WHERE table_number = 1;
UPDATE public.tables SET x_pos = 200, y_pos = 50 WHERE table_number = 2;
UPDATE public.tables SET x_pos = 350, y_pos = 50 WHERE table_number = 3;
UPDATE public.tables SET x_pos = 50, y_pos = 200 WHERE table_number = 4;
UPDATE public.tables SET x_pos = 200, y_pos = 200 WHERE table_number = 5;
UPDATE public.tables SET x_pos = 350, y_pos = 200 WHERE table_number = 6;
UPDATE public.tables SET x_pos = 50, y_pos = 350 WHERE table_number = 7;
UPDATE public.tables SET x_pos = 200, y_pos = 350 WHERE table_number = 8;
UPDATE public.tables SET x_pos = 350, y_pos = 350 WHERE table_number = 9;
UPDATE public.tables SET x_pos = 500, y_pos = 50 WHERE table_number = 10;
