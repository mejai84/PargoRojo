-- Sistema de Cupones y Ofertas

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase DECIMAL(10, 2) DEFAULT 0,
    max_discount DECIMAL(10, 2), -- Tope maximo para porcentajes
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    usage_limit INTEGER, -- null = ilimitado
    usage_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active);
CREATE INDEX IF NOT EXISTS idx_coupons_dates ON coupons(start_date, end_date);

-- RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can manage coupons"
    ON coupons FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

-- Users can read active valid coupons (for validation)
CREATE POLICY "Anyone can read active coupons"
    ON coupons FOR SELECT
    USING (active = true);

-- Agregar campo 'coupon_id' a orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- Funcion para validar cupon
CREATE OR REPLACE FUNCTION validate_coupon(
    p_code TEXT,
    p_purchase_amount DECIMAL
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
        RETURN jsonb_build_object('valid', false, 'message', 'Monto mínimo no alcanzado (' || v_coupon.min_purchase || ')');
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

-- Trigger para incrementar contador de uso
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.coupon_id IS NOT NULL THEN
        UPDATE coupons
        SET usage_count = usage_count + 1
        WHERE id = NEW.coupon_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_coupon_usage ON orders;
CREATE TRIGGER trigger_increment_coupon_usage
    AFTER INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.coupon_id IS NOT NULL)
    EXECUTE FUNCTION increment_coupon_usage();

-- Datos de ejemplo
INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, start_date) VALUES
    ('BIENVENIDA', '10% de descuento en tu primera compra', 'percentage', 10, 20000, NOW()),
    ('PARGOLUNES', '$5.000 OFF los lunes', 'fixed', 5000, 30000, NOW()),
    ('VIP20', '20% descuento compra mayor a 100k', 'percentage', 20, 100000, NOW())
ON CONFLICT (code) DO NOTHING;
