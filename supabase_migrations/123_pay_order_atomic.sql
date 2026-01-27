
-- =====================================================
-- FUNCIÓN PARA PAGAR ORDEN EXISTENTE DE FORMA ATÓMICA
-- =====================================================

CREATE OR REPLACE FUNCTION pay_order_atomic(
    p_order_id UUID,
    p_user_id UUID,
    p_cashbox_session_id UUID,
    p_payment_method TEXT,
    p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_cashbox_open BOOLEAN;
BEGIN
    -- 1. VALIDACIÓN CAJA
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cashbox_sessions') THEN
        IF p_cashbox_session_id IS NOT NULL THEN
            SELECT (status = 'OPEN')
            INTO v_cashbox_open
            FROM cashbox_sessions
            WHERE id = p_cashbox_session_id;
            
            IF NOT v_cashbox_open THEN
                RAISE EXCEPTION 'La caja no está abierta (Sesión Cerrada o Inválida).';
            END IF;
        ELSE
            -- Si no se pasa sesión, validar si el usuario tiene alguna abierta (opcional, pero recomendado)
            -- Por ahora asumimos que si es NULL es pago digital o algo externo, pero para POS estricto requerimos sesión
            IF p_payment_method = 'cash' THEN
                 RAISE EXCEPTION 'El pago en efectivo requiere una sesión de caja activa.';
            END IF;
        END IF;
    END IF;

    -- 2. VALIDACIÓN ORDEN
    SELECT * INTO v_order FROM orders WHERE id = p_order_id;
    
    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Orden no encontrada.';
    END IF;
    
    IF v_order.payment_status = 'paid' THEN
        RAISE EXCEPTION 'Esta orden ya está pagada.';
    END IF;

    -- 3. ACTUALIZAR ORDEN
    UPDATE orders 
    SET payment_status = 'paid',
        status = 'delivered', -- Cerrar ciclo
        payment_method = p_payment_method,
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Liberar mesa si aplica
    IF v_order.table_id IS NOT NULL THEN
        UPDATE tables 
        SET status = 'available' 
        WHERE id = v_order.table_id;
    END IF;

    -- 4. REGISTRAR PAGO
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        INSERT INTO payments (
            order_id,
            cashbox_session_id,
            payment_method,
            amount,
            status
        ) VALUES (
            p_order_id,
            p_cashbox_session_id,
            p_payment_method,
            p_amount,
            'completed'
        );
    END IF;

    -- 5. MOVIMIENTO DE CAJA (Solo si es efectivo y hay sesión)
    IF p_payment_method = 'cash' AND p_cashbox_session_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cash_movements') THEN
            INSERT INTO cash_movements (
                cashbox_session_id,
                user_id,
                movement_type,
                amount,
                payment_method,
                description,
                reference_id
            ) VALUES (
                p_cashbox_session_id,
                p_user_id,
                'SALE',
                p_amount,
                'cash',
                'Cobro Orden #' || SUBSTRING(p_order_id::text, 1, 8),
                p_order_id
            );
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Orden pagada exitosamente',
        'order_id', p_order_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al procesar pago: %', SQLERRM;
END;
$$;
