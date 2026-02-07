-- =========================================================
-- MIGRACIÓN 125: CORRECCIÓN DE POLÍTICAS RLS TABLA TABLES
-- Fecha: 7 de febrero de 2026
-- Bug: Posiciones de mesas no se guardan
-- Causa: Políticas RLS restrictivas
-- =========================================================

-- =========================================================
-- 1. ELIMINAR POLÍTICAS EXISTENTES CONFLICTIVAS
-- =========================================================

DROP POLICY IF EXISTS "tables_select_policy" ON tables;
DROP POLICY IF EXISTS "tables_insert_policy" ON tables;
DROP POLICY IF EXISTS "tables_update_policy" ON tables;
DROP POLICY IF EXISTS "tables_delete_policy" ON tables;
DROP POLICY IF EXISTS "Admin ve todas las mesas" ON tables;
DROP POLICY IF EXISTS "Staff ve mesas activas" ON tables;
DROP POLICY IF EXISTS "Solo admin puede modificar mesas" ON tables;

-- =========================================================
-- 2. ASEGURAR QUE LA TABLA TABLES TENGA RLS HABILITADO
-- =========================================================

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 3. POLÍTICAS NUEVAS Y CORREGIDAS
-- =========================================================

-- Política SELECT: Todos los autenticados pueden ver las mesas
CREATE POLICY "tables_select_all" 
ON tables 
FOR SELECT 
TO authenticated
USING (true);

-- Política SELECT: Público puede ver mesas activas (para QR)
CREATE POLICY "tables_select_public" 
ON tables 
FOR SELECT 
TO anon
USING (active = true);

-- Política INSERT: Solo admin puede crear mesas
CREATE POLICY "tables_insert_admin" 
ON tables 
FOR INSERT 
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- ✅ Política UPDATE: Admin y staff pueden actualizar mesas
-- Esta es la política CRÍTICA para que funcione el guardado de posiciones
CREATE POLICY "tables_update_admin_staff" 
ON tables 
FOR UPDATE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'staff', 'waiter')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'staff', 'waiter')
    )
);

-- Política DELETE: Solo admin puede eliminar mesas
CREATE POLICY "tables_delete_admin" 
ON tables 
FOR DELETE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =========================================================
-- 4. VERIFICAR QUE COLUMNAS DE POSICIÓN EXISTAN
-- =========================================================

-- Agregar columnas si no existen
DO $$
BEGIN
    -- x_pos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' AND column_name = 'x_pos'
    ) THEN
        ALTER TABLE tables ADD COLUMN x_pos INTEGER DEFAULT 0;
        RAISE NOTICE 'Columna x_pos agregada';
    END IF;
    
    -- y_pos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' AND column_name = 'y_pos'
    ) THEN
        ALTER TABLE tables ADD COLUMN y_pos INTEGER DEFAULT 0;
        RAISE NOTICE 'Columna y_pos agregada';
    END IF;
    
    -- width
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' AND column_name = 'width'
    ) THEN
        ALTER TABLE tables ADD COLUMN width INTEGER DEFAULT 120;
        RAISE NOTICE 'Columna width agregada';
    END IF;
    
    -- height
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' AND column_name = 'height'
    ) THEN
        ALTER TABLE tables ADD COLUMN height INTEGER DEFAULT 120;
        RAISE NOTICE 'Columna height agregada';
    END IF;
    
    -- rotation
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' AND column_name = 'rotation'
    ) THEN
        ALTER TABLE tables ADD COLUMN rotation INTEGER DEFAULT 0;
        RAISE NOTICE 'Columna rotation agregada';
    END IF;
    
    -- shape
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' AND column_name = 'shape'
    ) THEN
        ALTER TABLE tables ADD COLUMN shape TEXT DEFAULT 'rectangle';
        RAISE NOTICE 'Columna shape agregada';
    END IF;
END $$;

-- =========================================================
-- 5. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_tables_active ON tables(active);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_location ON tables(location);

-- =========================================================
-- 6. FUNCIÓN AUXILIAR PARA ACTUALIZAR POSICIÓN DE MESA
-- =========================================================

CREATE OR REPLACE FUNCTION update_table_position(
    p_table_id UUID,
    p_x_pos INTEGER,
    p_y_pos INTEGER,
    p_width INTEGER DEFAULT NULL,
    p_height INTEGER DEFAULT NULL,
    p_rotation INTEGER DEFAULT NULL,
    p_shape TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE tables
    SET 
        x_pos = p_x_pos,
        y_pos = p_y_pos,
        width = COALESCE(p_width, width),
        height = COALESCE(p_height, height),
        rotation = COALESCE(p_rotation, rotation),
        shape = COALESCE(p_shape, shape),
        updated_at = NOW()
    WHERE id = p_table_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_table_position IS 
'Actualiza la posición y dimensiones de una mesa. Devuelve true si se actualizó correctamente.';

-- =========================================================
-- 7. AGREGAR TRIGGER PARA UPDATED_AT SI NO EXISTE
-- =========================================================

-- Verificar si el trigger existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE tables ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Crear o reemplazar función de trigger
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS set_updated_at_tables ON tables;
CREATE TRIGGER set_updated_at_tables
    BEFORE UPDATE ON tables
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- =========================================================
-- 8. COMENTARIOS Y DOCUMENTACIÓN
-- =========================================================

COMMENT ON TABLE tables IS 
'Gestión de mesas del restaurante. Incluye posicionamiento 2D para mapa visual.';

COMMENT ON COLUMN tables.x_pos IS 'Posición X en el mapa 2D (píxeles)';
COMMENT ON COLUMN tables.y_pos IS 'Posición Y en el mapa 2D (píxeles)';
COMMENT ON COLUMN tables.width IS 'Ancho de la mesa en el mapa 2D (píxeles)';
COMMENT ON COLUMN tables.height IS 'Alto de la mesa en el mapa 2D (píxeles)';
COMMENT ON COLUMN tables.rotation IS 'Rotación de la mesa en grados (0-360)';
COMMENT ON COLUMN tables.shape IS 'Forma de la mesa: rectangle, circle, square';

-- =========================================================
-- 9. VERIFICACIÓN POST-MIGRACIÓN
-- =========================================================

DO $$
DECLARE
    v_policy_count INTEGER;
BEGIN
    -- Contar políticas de la tabla tables
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE tablename = 'tables';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICACIÓN POST-MIGRACIÓN 125 ===';
    RAISE NOTICE '✅ Políticas RLS creadas: %', v_policy_count;
    
    -- Verificar política UPDATE crítica
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tables' 
        AND cmd = 'UPDATE'
        AND policyname = 'tables_update_admin_staff'
    ) THEN
        RAISE NOTICE '✅ Política UPDATE para admin/staff creada correctamente';
    ELSE
        RAISE WARNING '⚠️ Política UPDATE no se creó - Revisar manualmente';
    END IF;
    
    -- Verificar columnas
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' 
        AND column_name IN ('x_pos', 'y_pos', 'width', 'height', 'rotation', 'shape')
        GROUP BY table_name
        HAVING COUNT(*) = 6
    ) THEN
        RAISE NOTICE '✅ Todas las columnas de posicionamiento existen';
    ELSE
        RAISE WARNING '⚠️ Faltan columnas de posicionamiento';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Migración 125 completada exitosamente';
END $$;

-- =========================================================
-- FIN DE MIGRACIÓN 125
-- =========================================================
