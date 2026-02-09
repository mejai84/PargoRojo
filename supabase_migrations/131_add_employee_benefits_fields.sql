-- Migración para añadir beneficios de empleados
-- Fecha: 09 de febrero de 2026

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS food_discount_pct NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_credit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_credit_spent NUMERIC DEFAULT 0;

COMMENT ON COLUMN profiles.food_discount_pct IS 'Porcentaje de descuento en comidas para el empleado';
COMMENT ON COLUMN profiles.max_credit IS 'Límite de crédito mensual para consumos del empleado';
COMMENT ON COLUMN profiles.current_credit_spent IS 'Crédito consumido en el periodo actual';
