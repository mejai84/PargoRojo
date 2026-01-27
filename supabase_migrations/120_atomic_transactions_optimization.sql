-- =====================================================
-- OPTIMIZACIÓN DE FLUJOS CRÍTICOS - TRANSACCIONES ATÓMICAS
-- VERSIÓN SINGLE-TENANT (Sin restaurant_id)
-- Fecha: 27 de enero de 2026
-- =====================================================

-- ============================================================================
-- 1. FUNCIÓN: Completar venta de forma atómica
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_sale_atomic(
    p_user_id UUID,
    p_cashbox_session_id UUID,
    p_items JSONB,
    p_payment_method TEXT,
    p_subtotal NUMERIC,
    p_total NUMERIC,
    p_tax NUMERIC DEFAULT 0,
    p_customer_id UUID DEFAULT NULL,
    p_table_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_product RECORD;
    v_cashbox_open BOOLEAN;
    v_result JSONB;
BEGIN
    -- 1. VALIDACIÓN: Verificar que la caja esté abierta (si existe la tabla)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cashbox_sessions') THEN
        SELECT (status = 'OPEN')
        INTO v_cashbox_open
        FROM cashbox_sessions
        WHERE id = p_cashbox_session_id;
        
        IF NOT v_cashbox_open THEN
            RAISE EXCEPTION 'La caja no está abierta. No se puede procesar la venta.';
        END IF;
    END IF;

    -- 2. CREAR LA ORDEN
    INSERT INTO orders (
        user_id,
        order_type,
        status,
        subtotal,
        total,
        payment_method,
        payment_status,
        notes,
        created_at
    ) VALUES (
        p_user_id,
        CASE WHEN p_table_id IS NOT NULL THEN 'dine_in' ELSE 'pickup' END,
        'delivered', -- Orden completada
        p_subtotal,
        p_total,
        p_payment_method,
        'paid',
        p_notes,
        NOW()
    )
    RETURNING id INTO v_order_id;

    -- 3. INSERTAR ITEMS Y ACTUALIZAR STOCK
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- 3.1 Obtener info del producto
        SELECT id, name, price
        INTO v_product
        FROM products
        WHERE id = (v_item->>'product_id')::UUID
          AND is_available = true;
        
        IF v_product.id IS NULL THEN
            RAISE EXCEPTION 'Producto no disponible: %', v_item->>'product_id';
        END IF;

        -- 3.2 Insertar item de la orden
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            unit_price
        ) VALUES (
            v_order_id,
            v_product.id,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::NUMERIC
        );
    END LOOP;

    -- 4. REGISTRAR PAGO (si existe la tabla payments)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        INSERT INTO payments (
            order_id,
            cashbox_session_id,
            payment_method,
            amount,
            status,
            created_at
        ) VALUES (
            v_order_id,
            p_cashbox_session_id,
            p_payment_method,
            p_total,
            'completed',
            NOW()
        );
    END IF;

    -- 5. REGISTRAR MOVIMIENTO DE CAJA (si existe la tabla)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cash_movements') THEN
        INSERT INTO cash_movements (
            cashbox_session_id,
            user_id,
            movement_type,
            amount,
            payment_method,
            description,
            reference_id,
            created_at
        ) VALUES (
            p_cashbox_session_id,
            p_user_id,
            'SALE',
            p_total,
            p_payment_method,
            'Venta POS #' || v_order_id,
            v_order_id,
            NOW()
        );
    END IF;

    -- 6. AUDITORÍA (si existe la tabla)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            metadata,
            created_at
        ) VALUES (
            p_user_id,
            'SALE_COMPLETED',
            'order',
            v_order_id,
            jsonb_build_object(
                'total', p_total,
                'payment_method', p_payment_method,
                'items_count', jsonb_array_length(p_items),
                'cashbox_session_id', p_cashbox_session_id
            ),
            NOW()
        );
    END IF;

    -- 7. RETORNAR RESULTADO
    v_result := jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'total', p_total,
        'message', 'Venta completada exitosamente'
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en venta atómica: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- ============================================================================
-- 2. FUNCIÓN: Revertir venta completa (anulación atómica)
-- ============================================================================

CREATE OR REPLACE FUNCTION revert_sale_atomic(
    p_order_id UUID,
    p_user_id UUID,
    p_reason TEXT,
    p_approver_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_cashbox_session_id UUID;
    v_minutes_elapsed INTEGER;
    v_result JSONB;
BEGIN
    -- 1. OBTENER ORDEN Y VALIDAR
    SELECT o.*, 
           EXTRACT(EPOCH FROM (NOW() - o.created_at))/60 as minutes_elapsed
    INTO v_order
    FROM orders o
    WHERE o.id = p_order_id;
    
    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Orden no encontrada';
    END IF;

    IF v_order.status = 'cancelled' THEN
        RAISE EXCEPTION 'La orden ya está anulada';
    END IF;

    v_minutes_elapsed := v_order.minutes_elapsed::INTEGER;

    -- 2. VALIDAR AUTORIZACIÓN (si es necesario)
    IF v_minutes_elapsed > 30 AND p_approver_id IS NULL THEN
        RAISE EXCEPTION 'Requiere autorización de supervisor para anular después de 30 minutos';
    END IF;

    -- 3. OBTENER SESIÓN DE CAJA (si existe)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        SELECT p.cashbox_session_id
        INTO v_cashbox_session_id
        FROM payments p
        WHERE p.order_id = p_order_id
        LIMIT 1;
    END IF;

    -- 4. MARCAR ORDEN COMO CANCELADA
    UPDATE orders
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = p_order_id;

    -- 5. MARCAR PAGOS COMO REFUNDED (si existe)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        UPDATE payments
        SET status = 'refunded',
            updated_at = NOW()
        WHERE order_id = p_order_id;
    END IF;

    -- 6. REGISTRAR MOVIMIENTO NEGATIVO EN CAJA (si existe)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cash_movements') 
       AND v_cashbox_session_id IS NOT NULL THEN
        INSERT INTO cash_movements (
            cashbox_session_id,
            user_id,
            movement_type,
            amount,
            description,
            reference_id,
            created_at
        ) VALUES (
            v_cashbox_session_id,
            p_user_id,
            'REFUND',
            v_order.total,
            'Anulación: ' || p_reason,
            p_order_id,
            NOW()
        );
    END IF;

    -- 7. AUDITORÍA COMPLETA (si existe)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            metadata,
            created_at
        ) VALUES (
            p_user_id,
            'SALE_CANCELLED',
            'order',
            p_order_id,
            jsonb_build_object(
                'original_total', v_order.total,
                'reason', p_reason,
                'approver_id', p_approver_id,
                'minutes_since_sale', v_minutes_elapsed
            ),
            NOW()
        );
    END IF;

    -- 8. RETORNAR RESULTADO
    v_result := jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'refunded_amount', v_order.total,
        'message', 'Venta anulada exitosamente'
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al revertir venta: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- ============================================================================
-- 3. FUNCIÓN: Validar disponibilidad de producto
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_stock_availability(
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_product RECORD;
    v_result JSONB;
BEGIN
    -- Obtener producto
    SELECT id, name, is_available
    INTO v_product
    FROM products
    WHERE id = p_product_id;
    
    IF v_product.id IS NULL THEN
        RETURN jsonb_build_object(
            'available', false,
            'reason', 'Producto no encontrado'
        );
    END IF;

    IF NOT v_product.is_available THEN
        RETURN jsonb_build_object(
            'available', false,
            'reason', 'Producto no disponible',
            'product_name', v_product.name
        );
    END IF;

    -- Todo OK
    RETURN jsonb_build_object(
        'available', true,
        'product_name', v_product.name
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'available', false,
            'reason', 'Error al validar: ' || SQLERRM
        );
END;
$$;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON FUNCTION complete_sale_atomic IS 
'Procesa una venta completa de forma atómica (single-tenant). Versión simplificada sin restaurant_id.';

COMMENT ON FUNCTION revert_sale_atomic IS 
'Revierte una venta completa con auditoría (single-tenant).';

COMMENT ON FUNCTION validate_stock_availability IS 
'Valida disponibilidad de producto (single-tenant).';

-- =====================================================
-- FIN DE MIGRACIÓN 120 - SINGLE TENANT
-- =====================================================
