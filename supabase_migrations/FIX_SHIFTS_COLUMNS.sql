-- =========================================================
-- FIX: Columnas faltantes en tabla shifts
-- Error: "Could not find the 'start_time' column of 'shifts'"
-- =========================================================

-- DIAGNÓSTICO
-- La tabla shifts tiene las columnas correctas:
-- - started_at (TIMESTAMPTZ) - cuando inicio el turno
-- - ended_at (TIMESTAMPTZ) - cuando termino el turno
--
-- NO tiene start_time/end_time porque esas están en shift_definitions

-- 1. Verificar estructura actual
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('shifts', 'shift_definitions')
ORDER BY table_name, ordinal_position;

-- 2. Ver turnos activos mal formados
SELECT * FROM public.shifts WHERE status = 'OPEN' LIMIT 10;

-- 3. Ver shift_definitions
SELECT * FROM public.shift_definitions;

-- 4. SOLUCIÓN: Asegurar que shift_definitions existe con datos
CREATE TABLE IF NOT EXISTS shift_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar turnos por defecto si no existen
INSERT INTO shift_definitions (name, start_time, end_time) 
VALUES 
    ('Mañana', '06:00:00', '14:00:00'),
    ('Tarde', '14:00:00', '22:00:00'),
    ('Noche', '22:00:00', '06:00:00')
ON CONFLICT (name) DO NOTHING;

-- 5. Ver resultado
SELECT * FROM shift_definitions;
