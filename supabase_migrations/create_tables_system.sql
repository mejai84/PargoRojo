-- Sistema de Mesas y QR
-- Tabla de mesas del restaurante

CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number INTEGER UNIQUE NOT NULL,
    table_name VARCHAR(50),
    capacity INTEGER DEFAULT 4,
    qr_code TEXT UNIQUE,
    status VARCHAR(20) DEFAULT 'available',
    location VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_tables_number ON tables(table_number);
CREATE INDEX IF NOT EXISTS idx_tables_qr ON tables(qr_code);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);

-- Comentarios
COMMENT ON TABLE tables IS 'Mesas del restaurante con codigos QR';
COMMENT ON COLUMN tables.status IS 'available, occupied, reserved, cleaning';
COMMENT ON COLUMN tables.qr_code IS 'Codigo unico para generar QR de la mesa';

-- RLS Policies
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver las mesas activas (para el menu QR)
CREATE POLICY "Anyone can view active tables"
    ON tables FOR SELECT
    USING (active = true);

-- Solo admins pueden modificar mesas
CREATE POLICY "Admins can manage tables"
    ON tables FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Funcion para generar codigo QR unico
CREATE OR REPLACE FUNCTION generate_table_qr_code(table_num INTEGER)
RETURNS TEXT AS $$
DECLARE
    qr_code TEXT;
BEGIN
    -- Generar codigo unico basado en numero de mesa y timestamp
    qr_code := 'TABLE-' || table_num || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;
    RETURN qr_code;
END;
$$ LANGUAGE plpgsql;

-- Funcion para actualizar estado de mesa
CREATE OR REPLACE FUNCTION update_table_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp
DROP TRIGGER IF EXISTS trigger_update_table_timestamp ON tables;
CREATE TRIGGER trigger_update_table_timestamp
    BEFORE UPDATE ON tables
    FOR EACH ROW
    EXECUTE FUNCTION update_table_status();

-- Insertar mesas de ejemplo (ajusta segun tu restaurante)
INSERT INTO tables (table_number, table_name, capacity, qr_code, location) VALUES
    (1, 'Mesa 1', 2, generate_table_qr_code(1), 'Terraza'),
    (2, 'Mesa 2', 4, generate_table_qr_code(2), 'Terraza'),
    (3, 'Mesa 3', 4, generate_table_qr_code(3), 'Interior'),
    (4, 'Mesa 4', 6, generate_table_qr_code(4), 'Interior'),
    (5, 'Mesa 5', 2, generate_table_qr_code(5), 'Barra'),
    (6, 'Mesa 6', 4, generate_table_qr_code(6), 'Interior'),
    (7, 'Mesa 7', 4, generate_table_qr_code(7), 'Interior'),
    (8, 'Mesa 8', 8, generate_table_qr_code(8), 'Salon VIP'),
    (9, 'Mesa 9', 2, generate_table_qr_code(9), 'Terraza'),
    (10, 'Mesa 10', 4, generate_table_qr_code(10), 'Interior')
ON CONFLICT (table_number) DO NOTHING;

-- Agregar campo table_id a orders para asociar pedidos con mesas
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES tables(id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
