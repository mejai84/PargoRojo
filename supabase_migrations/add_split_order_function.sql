
-- FUNCTION TO SPLIT ACTIVE ORDERS
-- This allows moving specific items from one order to a new one (same or different table)

CREATE OR REPLACE FUNCTION public.split_order(
    p_source_order_id UUID,
    p_item_ids UUID[],
    p_target_table_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_new_order_id UUID;
    v_source_table_id UUID;
    v_waiter_id UUID;
    v_new_subtotal NUMERIC := 0;
    v_old_subtotal NUMERIC := 0;
    v_guest_info JSONB;
BEGIN
    -- 1. Get info from source order
    SELECT table_id, waiter_id, guest_info INTO v_source_table_id, v_waiter_id, v_guest_info
    FROM public.orders WHERE id = p_source_order_id;
    
    -- Use source table if target not provided (splitting same table into two bills)
    IF p_target_table_id IS NULL THEN
        p_target_table_id := v_source_table_id;
    END IF;

    -- 2. Create New Order
    INSERT INTO public.orders (
        table_id, 
        waiter_id, 
        status, 
        subtotal, 
        total, 
        guest_info,
        order_type,
        created_at
    )
    VALUES (
        p_target_table_id, 
        v_waiter_id, 
        'pending', 
        0, 
        0, 
        v_guest_info,
        'dine_in',
        NOW()
    )
    RETURNING id INTO v_new_order_id;

    -- 3. Move items
    UPDATE public.order_items
    SET order_id = v_new_order_id
    WHERE id = ANY(p_item_ids) AND order_id = p_source_order_id;

    -- 4. Recalculate Totals
    -- For new order
    SELECT SUM(quantity * price) INTO v_new_subtotal
    FROM public.order_items WHERE order_id = v_new_order_id;
    
    UPDATE public.orders 
    SET subtotal = COALESCE(v_new_subtotal, 0), 
        total = COALESCE(v_new_subtotal, 0) 
    WHERE id = v_new_order_id;

    -- For source order
    SELECT SUM(quantity * price) INTO v_old_subtotal
    FROM public.order_items WHERE order_id = p_source_order_id;
    
    UPDATE public.orders 
    SET subtotal = COALESCE(v_old_subtotal, 0), 
        total = COALESCE(v_old_subtotal, 0) 
    WHERE id = p_source_order_id;

    -- 5. If source order became empty, we could cancel it, but let's keep it for now
    -- or if you prefer: IF v_old_subtotal = 0 THEN UPDATE orders SET status = 'cancelled' WHERE id = p_source_order_id; END IF;

    RETURN v_new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
