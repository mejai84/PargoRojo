-- PASO 10: ACTUALIZAR RPC PARA PROPINAS (VERSIÓN ROBUSTA)

CREATE OR REPLACE FUNCTION public.pay_order_atomic(
    p_order_id UUID,
    p_user_id UUID,
    p_cashbox_session_id UUID,
    p_payment_method TEXT,
    p_amount NUMERIC,
    p_tip_amount NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_cashbox_open BOOLEAN;
BEGIN
    -- 1. VALIDACIÓN ORDEN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    
    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Orden no encontrada.';
    END IF;
    
    IF v_order.payment_status = 'paid' THEN
        RAISE EXCEPTION 'Esta orden ya está pagada.';
    END IF;

    -- 2. VALIDACIÓN CAJA (Solo si es efectivo)
    IF p_payment_method = 'cash' THEN
        IF p_cashbox_session_id IS NOT NULL THEN
            SELECT (status = 'OPEN')
            INTO v_cashbox_open
            FROM public.cashbox_sessions
            WHERE id = p_cashbox_session_id;
            
            IF NOT COALESCE(v_cashbox_open, FALSE) THEN
                RAISE EXCEPTION 'La caja no está abierta para recibir efectivo.';
            END IF;
        ELSE
            RAISE EXCEPTION 'El pago en efectivo requiere una sesión de caja activa.';
        END IF;
    END IF;

    -- 3. ACTUALIZAR ORDEN
    UPDATE public.orders 
    SET payment_status = 'paid',
        status = 'delivered',
        payment_method = p_payment_method,
        tip_amount = COALESCE(p_tip_amount, 0),
        total = p_amount, -- P_AMOUNT DEBE SER SUBTOTAL + PROPINA
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Liberar mesa
    IF v_order.table_id IS NOT NULL THEN
        UPDATE public.tables 
        SET status = 'available' 
        WHERE id = v_order.table_id;
    END IF;

    -- 4. MOVIMIENTO DE CAJA (Solo si es efectivo y hay sesión)
    IF p_payment_method = 'cash' AND p_cashbox_session_id IS NOT NULL THEN
        INSERT INTO public.cash_movements (
            restaurant_id,
            cashbox_session_id,
            user_id,
            movement_type,
            amount,
            payment_method,
            description,
            reference_id,
            created_at
        ) VALUES (
            v_order.restaurant_id,
            p_cashbox_session_id,
            p_user_id,
            'SALE',
            p_amount,
            p_payment_method,
            'Pago Orden #' || SUBSTRING(p_order_id::text, 1, 8) || ' (Incl. Propina)',
            p_order_id,
            NOW()
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Orden pagada exitosamente',
        'order_id', p_order_id,
        'total', p_amount,
        'tip', p_tip_amount
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error: %', SQLERRM;
END;
$$;
