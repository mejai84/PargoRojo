
-- =====================================================
-- CONFIGURACIÓN DE TURNOS Y HORAS EXTRAS (VERSIÓN OPTIMIZADA)
-- =====================================================

-- 1. Tabla de Definiciones de Turnos (Sin bloqueos a otras tablas)
CREATE TABLE IF NOT EXISTS shift_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar datos base
INSERT INTO shift_definitions (name, start_time, end_time) 
VALUES 
    ('Mañana', '06:00:00', '14:00:00'),
    ('Tarde', '14:00:00', '22:00:00'),
    ('Noche', '22:00:00', '06:00:00')
ON CONFLICT (name) DO NOTHING;

-- 2. Modificar tabla shifts (Operaciones atómicas rápidas)
-- Usamos IF NOT EXISTS nativo para evitar bloqueos de comprobación PL/SQL

ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS shift_definition_id UUID REFERENCES shift_definitions(id);

ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC(5, 2) DEFAULT 0;

ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS regular_hours NUMERIC(5, 2) DEFAULT 0;

-- 3. Función de cálculo (Solo se define, no bloquea datos)
CREATE OR REPLACE FUNCTION calculate_shift_hours()
RETURNS TRIGGER AS $$
DECLARE
    v_start TIMESTAMP;
    v_end TIMESTAMP;
    v_total_duration INTERVAL;
    v_total_hours NUMERIC;
    v_overtime NUMERIC := 0;
BEGIN
    -- Solo calcular al cerrar
    IF NEW.status = 'CLOSED' AND OLD.status = 'OPEN' THEN
        v_start := NEW.started_at;
        v_end := NEW.ended_at;
        
        -- Duración en horas
        v_total_duration := v_end - v_start;
        v_total_hours := EXTRACT(EPOCH FROM v_total_duration) / 3600;
        
        -- Lógica de extras (Umbral > 8 horas por defecto si hay definición)
        IF NEW.shift_definition_id IS NOT NULL THEN
            IF v_total_hours > 8 THEN
                v_overtime := v_total_hours - 8;
            END IF;
        END IF;
        
        NEW.regular_hours := v_total_hours - v_overtime;
        NEW.overtime_hours := v_overtime;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger (Puede requerir bloqueo breve, reintentar si falla)
DROP TRIGGER IF EXISTS trigger_calculate_hours ON shifts;
CREATE TRIGGER trigger_calculate_hours
    BEFORE UPDATE ON shifts
    FOR EACH ROW
    WHEN (NEW.status = 'CLOSED')
    EXECUTE FUNCTION calculate_shift_hours();
