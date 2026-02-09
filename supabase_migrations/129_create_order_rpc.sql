-- Función para crear pedidos ignorando RLS (Security Definer)
-- Esto soluciona problemas de permisos en Kiosco o Meseros con roles limitados
-- Se recibe un objeto JSON con toda la estructura de la orden

CREATE OR REPLACE FUNCTION create_order_v2(order_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con permisos del creador (postgres), ignorando RLS del usuario
SET search_path = public
AS $$
DECLARE
    new_order_id UUID;
    item JSONB;
    new_order_record RECORD;
BEGIN
    -- 1. Insertar Orden
    INSERT INTO orders (
        restaurant_id,
        user_id,
        waiter_id,
        table_id,
        customer_id,
        order_type,
        status,
        subtotal,
        tax,
        total,
        notes,
        payment_method,
        payment_status
    ) VALUES (
        (order_data->>'restaurant_id')::UUID,
        (order_data->>'user_id')::UUID,
        (order_data->>'waiter_id')::UUID,
        (order_data->>'table_id')::UUID,
        (order_data->>'customer_id')::UUID,
        order_data->>'order_type',
        'pending', -- status inicial siempre pending
        (order_data->>'subtotal')::NUMERIC,
        COALESCE((order_data->>'tax')::NUMERIC, 0),
        (order_data->>'total')::NUMERIC,
        order_data->>'notes',
        'cash', -- default
        'pending' -- default
    )
    RETURNING * INTO new_order_record;

    new_order_id := new_order_record.id;

    -- 2. Insertar Items
    FOR item IN SELECT * FROM jsonb_array_elements(order_data->'items')
    LOOP
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            unit_price,
            subtotal,
            notes
        ) VALUES (
            new_order_id,
            (item->>'product_id')::UUID,
            (item->>'quantity')::INTEGER,
            (item->>'unit_price')::NUMERIC,
            (item->>'subtotal')::NUMERIC,
            item->>'notes'
        );
    END LOOP;

    -- 3. Retornar la orden creada
    RETURN to_jsonb(new_order_record);

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creando orden: %', SQLERRM;
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION create_order_v2(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_v2(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION create_order_v2(JSONB) TO anon; -- Necesario si el kiosco no tiene usuario
