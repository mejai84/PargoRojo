-- Migration to add customer restriction and seasonal tags to coupons
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES profiles(id);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS seasonal_tag VARCHAR(50);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS category VARCHAR(50); -- Added for more flexibility

-- Update validate_coupon function to handle customer restriction
CREATE OR REPLACE FUNCTION validate_coupon(
    p_code TEXT,
    p_purchase_amount DECIMAL,
    p_customer_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_coupon RECORD;
    v_discount DECIMAL;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- Buscar cupon
    SELECT * INTO v_coupon
    FROM coupons
    WHERE code = UPPER(p_code)
    AND active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'message', 'Cupón no existe o inactivo');
    END IF;

    -- Validar restriccion de cliente
    IF v_coupon.customer_id IS NOT NULL THEN
        IF p_customer_id IS NULL OR v_coupon.customer_id != p_customer_id THEN
            RETURN jsonb_build_object('valid', false, 'message', 'Este cupón es exclusivo para otro cliente');
        END IF;
    END IF;

    -- Validar fechas
    IF v_coupon.start_date > v_now OR (v_coupon.end_date IS NOT NULL AND v_coupon.end_date < v_now) THEN
        RETURN jsonb_build_object('valid', false, 'message', 'Cupón expirado o aún no vigente');
    END IF;

    -- Validar limites de uso
    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
        RETURN jsonb_build_object('valid', false, 'message', 'Cupón agotado');
    END IF;

    -- Validar monto minimo
    IF p_purchase_amount < v_coupon.min_purchase THEN
        RETURN jsonb_build_object('valid', false, 'message', 'Monto mínimo no alcanzado ($' || v_coupon.min_purchase || ')');
    END IF;

    -- Calcular descuento
    IF v_coupon.discount_type = 'percentage' THEN
        v_discount := p_purchase_amount * (v_coupon.discount_value / 100);
        -- Aplicar tope si existe
        IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
            v_discount := v_coupon.max_discount;
        END IF;
    ELSE
        v_discount := v_coupon.discount_value;
    END IF;

    -- No permitir descuento mayor al total
    IF v_discount > p_purchase_amount THEN
        v_discount := p_purchase_amount;
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'coupon_id', v_coupon.id,
        'code', v_coupon.code,
        'discount_amount', v_discount,
        'final_amount', p_purchase_amount - v_discount,
        'type', v_coupon.discount_type,
        'value', v_coupon.discount_value
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
