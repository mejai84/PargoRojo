
-- IMPROVED INVENTORY DEDUCTION SYSTEM
-- This script replaces the old order-level trigger with a more precise item-level trigger

-- 1. Remove old order-level trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_deduct_inventory_on_sale ON public.orders;
DROP FUNCTION IF EXISTS public.deduct_inventory_on_sale();

-- 2. Create the item-level deduction function
CREATE OR REPLACE FUNCTION public.deduct_inventory_from_item()
RETURNS TRIGGER AS $$
DECLARE
    recipe_row RECORD;
    v_ingredient_name TEXT;
    v_current_stock DECIMAL;
    v_min_stock DECIMAL;
    v_unit TEXT;
    v_quantity_to_deduct DECIMAL;
BEGIN
    -- For each ingredient in the product's recipe
    FOR recipe_row IN 
        SELECT ingredient_id, quantity 
        FROM public.recipes 
        WHERE product_id = NEW.product_id
    LOOP
        -- Calculate total deduction (recipe quantity * item quantity)
        v_quantity_to_deduct := recipe_row.quantity * NEW.quantity;

        -- Get current ingredient data
        SELECT name, current_stock, min_stock, unit 
        INTO v_ingredient_name, v_current_stock, v_min_stock, v_unit
        FROM public.ingredients 
        WHERE id = recipe_row.ingredient_id;

        -- Update stock
        UPDATE public.ingredients
        SET current_stock = current_stock - v_quantity_to_deduct,
            updated_at = NOW()
        WHERE id = recipe_row.ingredient_id;

        -- Log movement
        INSERT INTO public.inventory_movements (
            ingredient_id,
            movement_type,
            quantity,
            previous_stock,
            new_stock,
            reference_id,
            reference_type,
            notes
        ) VALUES (
            recipe_row.ingredient_id,
            'sale',
            -v_quantity_to_deduct,
            v_current_stock,
            v_current_stock - v_quantity_to_deduct,
            NEW.order_id,
            'order_item',
            'Descuento automático: Venta de ' || NEW.quantity || ' unidades de producto ID: ' || NEW.product_id
        );

        -- Check for low stock and notify if necessary
        IF (v_current_stock - v_quantity_to_deduct) <= v_min_stock THEN
            -- Insert notification for admins
            -- We assume a notifications table exists as seen in previous migrations
            INSERT INTO public.notifications (user_id, type, title, message, data)
            SELECT 
                profiles.id,
                'low_stock',
                '⚠️ STOCK BAJO: ' || v_ingredient_name,
                'El ingrediente ' || v_ingredient_name || ' ha llegado a su nivel mínimo (' || (v_current_stock - v_quantity_to_deduct) || ' ' || v_unit || ').',
                jsonb_build_object(
                    'ingredient_id', recipe_row.ingredient_id,
                    'current_stock', v_current_stock - v_quantity_to_deduct,
                    'min_stock', v_min_stock
                )
            FROM public.profiles
            WHERE profiles.role = 'admin';
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger on order_items
DROP TRIGGER IF EXISTS trg_deduct_inventory_on_item_insert ON public.order_items;
CREATE TRIGGER trg_deduct_inventory_on_item_insert
    AFTER INSERT ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.deduct_inventory_from_item();

-- 4. Function to handle order cancellation (RESTORE inventory)
CREATE OR REPLACE FUNCTION public.restore_inventory_on_cancellation()
RETURNS TRIGGER AS $$
DECLARE
    item_row RECORD;
    recipe_row RECORD;
BEGIN
    -- If order status changes to 'cancelled'
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        FOR item_row IN SELECT product_id, quantity FROM public.order_items WHERE order_id = NEW.id LOOP
            FOR recipe_row IN SELECT ingredient_id, quantity FROM public.recipes WHERE product_id = item_row.product_id LOOP
                
                UPDATE public.ingredients
                SET current_stock = current_stock + (recipe_row.quantity * item_row.quantity),
                    updated_at = NOW()
                WHERE id = recipe_row.ingredient_id;

                INSERT INTO public.inventory_movements (
                    ingredient_id,
                    movement_type,
                    quantity,
                    reference_id,
                    reference_type,
                    notes
                ) VALUES (
                    recipe_row.ingredient_id,
                    'adjustment',
                    (recipe_row.quantity * item_row.quantity),
                    NEW.id,
                    'order_cancellation',
                    'Devolución de stock por cancelación de pedido #' || NEW.id
                );
            END LOOP;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for cancellation
DROP TRIGGER IF EXISTS trg_restore_inventory_on_cancel ON public.orders;
CREATE TRIGGER trg_restore_inventory_on_cancel
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    WHEN (NEW.status = 'cancelled' AND OLD.status != 'cancelled')
    EXECUTE FUNCTION public.restore_inventory_on_cancellation();
