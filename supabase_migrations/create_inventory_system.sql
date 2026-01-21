-- Sistema de Control de Inventario
-- Gestion de ingredientes, recetas y stock

-- Tabla de ingredientes
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(50) NOT NULL,
    current_stock DECIMAL(10, 2) DEFAULT 0,
    min_stock DECIMAL(10, 2) DEFAULT 0,
    max_stock DECIMAL(10, 2),
    cost_per_unit DECIMAL(10, 2) DEFAULT 0,
    supplier VARCHAR(255),
    category VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de recetas (relacion productos-ingredientes)
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, ingredient_id)
);

-- Tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    previous_stock DECIMAL(10, 2),
    new_stock DECIMAL(10, 2),
    cost DECIMAL(10, 2),
    reference_id UUID,
    reference_type VARCHAR(50),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_stock ON ingredients(current_stock);
CREATE INDEX IF NOT EXISTS idx_recipes_product ON recipes(product_id);
CREATE INDEX IF NOT EXISTS idx_recipes_ingredient ON recipes(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_ingredient ON inventory_movements(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(created_at DESC);

-- Comentarios
COMMENT ON TABLE ingredients IS 'Ingredientes y materias primas del restaurante';
COMMENT ON TABLE recipes IS 'Recetas: relacion entre productos y sus ingredientes';
COMMENT ON TABLE inventory_movements IS 'Historial de movimientos de inventario';
COMMENT ON COLUMN inventory_movements.movement_type IS 'purchase, sale, adjustment, waste, transfer';

-- RLS Policies
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Admins pueden ver y gestionar todo
CREATE POLICY "Admins can manage ingredients"
    ON ingredients FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY "Admins can manage recipes"
    ON recipes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY "Admins can view inventory movements"
    ON inventory_movements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY "System can insert inventory movements"
    ON inventory_movements FOR INSERT
    WITH CHECK (true);

-- Funcion para actualizar timestamp
CREATE OR REPLACE FUNCTION update_ingredient_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp
DROP TRIGGER IF EXISTS trigger_update_ingredient_timestamp ON ingredients;
CREATE TRIGGER trigger_update_ingredient_timestamp
    BEFORE UPDATE ON ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_ingredient_timestamp();

-- Funcion para descontar inventario cuando se vende un producto
CREATE OR REPLACE FUNCTION deduct_inventory_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    recipe_item RECORD;
    ingredient_record RECORD;
BEGIN
    -- Solo procesar si el pedido esta confirmado (no pendiente de pago)
    IF NEW.status IN ('pending', 'preparing', 'ready', 'delivered') THEN
        -- Iterar sobre los items del pedido
        FOR recipe_item IN
            SELECT oi.product_id, oi.quantity, r.ingredient_id, r.quantity as recipe_quantity
            FROM order_items oi
            JOIN recipes r ON r.product_id = oi.product_id
            WHERE oi.order_id = NEW.id
        LOOP
            -- Obtener el ingrediente
            SELECT * INTO ingredient_record
            FROM ingredients
            WHERE id = recipe_item.ingredient_id;

            -- Calcular cantidad a descontar
            DECLARE
                quantity_to_deduct DECIMAL(10, 2);
                new_stock DECIMAL(10, 2);
            BEGIN
                quantity_to_deduct := recipe_item.recipe_quantity * recipe_item.quantity;
                new_stock := ingredient_record.current_stock - quantity_to_deduct;

                -- Actualizar stock del ingrediente
                UPDATE ingredients
                SET current_stock = new_stock
                WHERE id = recipe_item.ingredient_id;

                -- Registrar movimiento
                INSERT INTO inventory_movements (
                    ingredient_id,
                    movement_type,
                    quantity,
                    previous_stock,
                    new_stock,
                    reference_id,
                    reference_type,
                    notes
                ) VALUES (
                    recipe_item.ingredient_id,
                    'sale',
                    -quantity_to_deduct,
                    ingredient_record.current_stock,
                    new_stock,
                    NEW.id,
                    'order',
                    'Descuento automatico por venta - Pedido #' || SUBSTRING(NEW.id::TEXT, 1, 8)
                );

                -- Crear notificacion si stock esta bajo
                IF new_stock <= ingredient_record.min_stock THEN
                    -- Notificar a todos los admins
                    INSERT INTO notifications (user_id, type, title, message, data)
                    SELECT 
                        id,
                        'low_stock',
                        '⚠️ Stock Bajo',
                        'El ingrediente "' || ingredient_record.name || '" tiene stock bajo (' || new_stock || ' ' || ingredient_record.unit || ')',
                        jsonb_build_object(
                            'ingredient_id', recipe_item.ingredient_id,
                            'ingredient_name', ingredient_record.name,
                            'current_stock', new_stock,
                            'min_stock', ingredient_record.min_stock,
                            'unit', ingredient_record.unit
                        )
                    FROM auth.users
                    WHERE raw_user_meta_data->>'role' = 'admin';
                END IF;
            END;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para descontar inventario cuando se confirma un pedido
DROP TRIGGER IF EXISTS trigger_deduct_inventory_on_sale ON orders;
CREATE TRIGGER trigger_deduct_inventory_on_sale
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION deduct_inventory_on_sale();

-- Funcion para registrar compra de ingredientes
CREATE OR REPLACE FUNCTION register_ingredient_purchase(
    p_ingredient_id UUID,
    p_quantity DECIMAL,
    p_cost DECIMAL,
    p_notes TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_ingredient RECORD;
    v_new_stock DECIMAL;
BEGIN
    -- Obtener ingrediente actual
    SELECT * INTO v_ingredient
    FROM ingredients
    WHERE id = p_ingredient_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ingrediente no encontrado';
    END IF;

    -- Calcular nuevo stock
    v_new_stock := v_ingredient.current_stock + p_quantity;

    -- Actualizar stock
    UPDATE ingredients
    SET current_stock = v_new_stock
    WHERE id = p_ingredient_id;

    -- Registrar movimiento
    INSERT INTO inventory_movements (
        ingredient_id,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        cost,
        reference_type,
        notes,
        created_by
    ) VALUES (
        p_ingredient_id,
        'purchase',
        p_quantity,
        v_ingredient.current_stock,
        v_new_stock,
        p_cost,
        'manual',
        p_notes,
        auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcion para ajustar inventario manualmente
CREATE OR REPLACE FUNCTION adjust_ingredient_stock(
    p_ingredient_id UUID,
    p_new_stock DECIMAL,
    p_reason TEXT DEFAULT 'Ajuste manual'
)
RETURNS void AS $$
DECLARE
    v_ingredient RECORD;
    v_difference DECIMAL;
BEGIN
    -- Obtener ingrediente actual
    SELECT * INTO v_ingredient
    FROM ingredients
    WHERE id = p_ingredient_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ingrediente no encontrado';
    END IF;

    -- Calcular diferencia
    v_difference := p_new_stock - v_ingredient.current_stock;

    -- Actualizar stock
    UPDATE ingredients
    SET current_stock = p_new_stock
    WHERE id = p_ingredient_id;

    -- Registrar movimiento
    INSERT INTO inventory_movements (
        ingredient_id,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        reference_type,
        notes,
        created_by
    ) VALUES (
        p_ingredient_id,
        'adjustment',
        v_difference,
        v_ingredient.current_stock,
        p_new_stock,
        'manual',
        p_reason,
        auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insertar ingredientes de ejemplo
INSERT INTO ingredients (name, description, unit, current_stock, min_stock, max_stock, cost_per_unit, category) VALUES
    ('Pargo Rojo', 'Pescado fresco pargo rojo', 'kg', 50, 10, 100, 25000, 'Pescados'),
    ('Camaron', 'Camaron fresco grande', 'kg', 30, 5, 50, 35000, 'Mariscos'),
    ('Calamar', 'Calamar fresco', 'kg', 20, 5, 40, 28000, 'Mariscos'),
    ('Arroz', 'Arroz blanco premium', 'kg', 100, 20, 200, 3000, 'Granos'),
    ('Aceite', 'Aceite vegetal', 'litros', 40, 10, 80, 8000, 'Aceites'),
    ('Cebolla', 'Cebolla cabezona', 'kg', 25, 5, 50, 2500, 'Verduras'),
    ('Tomate', 'Tomate chonto', 'kg', 30, 5, 60, 3000, 'Verduras'),
    ('Ajo', 'Ajo fresco', 'kg', 10, 2, 20, 12000, 'Condimentos'),
    ('Limon', 'Limon tahiti', 'kg', 15, 3, 30, 4000, 'Frutas'),
    ('Cilantro', 'Cilantro fresco', 'kg', 5, 1, 10, 3500, 'Hierbas'),
    ('Sal', 'Sal marina', 'kg', 50, 10, 100, 2000, 'Condimentos'),
    ('Pimienta', 'Pimienta negra molida', 'kg', 5, 1, 10, 15000, 'Condimentos'),
    ('Cerveza', 'Cerveza nacional', 'unidades', 200, 50, 500, 2500, 'Bebidas'),
    ('Gaseosa', 'Gaseosa 400ml', 'unidades', 150, 30, 300, 2000, 'Bebidas'),
    ('Agua', 'Agua embotellada', 'unidades', 100, 20, 200, 1500, 'Bebidas')
ON CONFLICT DO NOTHING;
