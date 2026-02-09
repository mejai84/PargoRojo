-- MIGRACIÓN PARA CORREGIR TRASPASO Y FUSIÓN DE MESAS
-- Actualiza la función para manejar estados de tabla y sumas de subtotales.

CREATE OR REPLACE FUNCTION transfer_order_to_table(
    p_order_id UUID,
    p_target_table_id UUID,
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_source_table_id UUID;
    v_existing_order UUID;
    v_items_count INTEGER;
BEGIN
    -- 1. Obtener datos de la orden origen
    SELECT o.*, o.table_id INTO v_order FROM orders o WHERE o.id = p_order_id;
    IF v_order.id IS NULL THEN RAISE EXCEPTION 'Orden no encontrada'; END IF;
    v_source_table_id := v_order.table_id;
    
    -- 2. Buscar si la mesa destino ya tiene una orden activa
    SELECT id INTO v_existing_order 
    FROM orders 
    WHERE table_id = p_target_table_id 
    AND status NOT IN ('delivered', 'cancelled', 'paid', 'completed') 
    LIMIT 1;
    
    IF v_existing_order IS NOT NULL THEN
        -- CASO FUSIÓN: La mesa destino ya estaba ocupada
        -- Mover los items de la orden origen a la orden destino
        UPDATE order_items 
        SET order_id = v_existing_order, 
            updated_at = NOW() 
        WHERE order_id = p_order_id;
        
        -- Recalcular totales de la orden destino (incluyendo adiciones y descuentos si los hubiera)
        UPDATE orders 
        SET subtotal = (SELECT COALESCE(SUM(unit_price * quantity), 0) FROM order_items WHERE order_id = v_existing_order),
            total = (SELECT COALESCE(SUM(unit_price * quantity), 0) FROM order_items WHERE order_id = v_existing_order),
            updated_at = NOW() 
        WHERE id = v_existing_order;
        
        -- Cancelar la orden origen vacía
        UPDATE orders SET status = 'cancelled', notes = COALESCE(notes, '') || ' (Fusionada con ' || v_existing_order || ')', updated_at = NOW() WHERE id = p_order_id;
    ELSE
        -- CASO TRASPASO SIMPLE: Mesa destino libre
        UPDATE orders SET table_id = p_target_table_id, updated_at = NOW() WHERE id = p_order_id;
        -- Marcar mesa destino como ocupada
        UPDATE tables SET status = 'occupied' WHERE id = p_target_table_id;
    END IF;
    
    -- 3. IMPORTANTE: Marcar mesa origen como libre
    IF v_source_table_id IS NOT NULL THEN
        UPDATE tables SET status = 'free' WHERE id = v_source_table_id;
    END IF;
    
    -- 4. Registrar auditoría de traspaso
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'table_transfers') THEN
        INSERT INTO table_transfers (source_table_id, target_table_id, order_id, transferred_by, reason) 
        VALUES (v_source_table_id, p_target_table_id, p_order_id, p_user_id, COALESCE(p_reason, 'Cambio/Fusión de mesa'));
    END IF;
    
    RETURN jsonb_build_object(
        'success', true, 
        'merged', v_existing_order IS NOT NULL,
        'target_order_id', COALESCE(v_existing_order, p_order_id)
    );
END;
$$;
