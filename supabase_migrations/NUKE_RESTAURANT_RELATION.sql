-- =========================================================
-- PRUEBA DE FUEGO: ELIMINAR COLUMNA RESTAURANT_ID
-- Objetivo: Ver si la Foreign Key con 'restaurants' es la causa del bloqueo
-- =========================================================

BEGIN;

-- 1. ELIMINAR LA RELACIÓN Y LA COLUMNA DE PROFILES
ALTER TABLE public.profiles DROP COLUMN IF EXISTS restaurant_id CASCADE;

-- 2. RECARGAR
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ COLUMNA restaurant_id ELIMINADA - PRUEBA LOGIN AHORA' as estado;
