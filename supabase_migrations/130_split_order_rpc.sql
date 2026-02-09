-- Función para dividir una orden (Split Check)
-- Mueve items seleccionados a una nueva orden

CREATE OR REPLACE FUNCTION split_order(
    p_source_order_id UUID,
    p_items JSONB -- Array de objetos: { "item_id": "uuid", "quantity": int }
)
RETURNS JSONB -- Retorna la nueva orden creada
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_source_order RECORD;
    v_new_order_id UUID;
    v_new_order RECORD;
    v_item RECORD;
    v_item_data JSONB;
    v_move_qty INTEGER;
BEGIN
    -- 1. Obtener orden original
    SELECT * INTO v_source_order FROM orders WHERE id = p_source_order_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Orden original no encontrada'; END IF;

    -- 2. Crear nueva orden (Clonando datos básicos)
    INSERT INTO orders (
        restaurant_id, table_id, user_id, waiter_id, customer_id, 
        order_type, status, notes, created_at,
        subtotal, tax, total, payment_status
    ) VALUES (
        v_source_order.restaurant_id,
        v_source_order.table_id,
        v_source_order.user_id,
        v_source_order.waiter_id,
        v_source_order.customer_id,
        v_source_order.order_type,
        'pending', -- Estado inicial
        'División de Orden #' || substring(p_source_order_id::text, 1, 8),
        NOW(),
        0, 0, 0, 'pending'
    ) RETURNING id INTO v_new_order_id;

    -- 3. Procesar items a mover
    FOR v_item_data IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Obtener item actual
        SELECT * INTO v_item FROM order_items WHERE id = (v_item_data->>'item_id')::UUID;
        
        -- Si no existe o no pertenece a la orden, saltar
        IF NOT FOUND OR v_item.order_id != p_source_order_id THEN CONTINUE; END IF;

        v_move_qty := (v_item_data->>'quantity')::INTEGER;
        
        IF v_move_qty >= v_item.quantity THEN
            -- CASO A: Mover item completo
            UPDATE order_items 
            SET order_id = v_new_order_id, updated_at = NOW()
            WHERE id = v_item.id;
        ELSE
            -- CASO B: Dividir item (Partial Split)
            -- 1. Reducir original
            UPDATE order_items 
            SET quantity = quantity - v_move_qty,
                subtotal = (quantity - v_move_qty) * unit_price,
                updated_at = NOW()
            WHERE id = v_item.id;

            -- 2. Crear nuevo item en nueva orden
            INSERT INTO order_items (
                order_id, product_id, quantity, unit_price, subtotal, notes
            ) VALUES (
                v_new_order_id,
                v_item.product_id,
                v_move_qty,
                v_item.unit_price,
                v_move_qty * v_item.unit_price,
                v_item.notes
            );
        END IF;
    END LOOP;

    -- 4. Recalcular totales para ORDEN ORIGINAL
    UPDATE orders 
    SET subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = p_source_order_id),
        total = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = p_source_order_id)
        -- Nota: Si hay lógica de impuestos compleja, debería ir aquí. Asumimos total = subtotal por ahora o impuestos incluidos.
    WHERE id = p_source_order_id;

    -- 5. Recalcular totales para NUEVA ORDEN
    UPDATE orders 
    SET subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = v_new_order_id),
        total = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = v_new_order_id)
    WHERE id = v_new_order_id
    RETURNING * INTO v_new_order;

    RETURN to_jsonb(v_new_order);
END;
$$;

GRANT EXECUTE ON FUNCTION split_order(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION split_order(UUID, JSONB) TO service_role;
