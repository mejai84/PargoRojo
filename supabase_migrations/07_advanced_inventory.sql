-- =============================================
-- ADVANCED INVENTORY SYSTEM
-- Suppliers, formal purchases, waste tracking, and valuations
-- =============================================

-- 1. Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_id TEXT, -- NIT/RUT
    category TEXT, -- 'Proteins', 'Vegetables', 'Beverages', etc.
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Update Ingredients to reference Suppliers
ALTER TABLE public.ingredients 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- 3. Formal Purchases Table (Inventory Entries)
CREATE TABLE IF NOT EXISTS public.inventory_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    invoice_number TEXT,
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    total_amount NUMERIC(10, 2) DEFAULT 0,
    payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Purchase Items (Detailed stock entries)
CREATE TABLE IF NOT EXISTS public.inventory_purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES public.inventory_purchases(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit_cost NUMERIC(10, 2) NOT NULL,
    total_cost NUMERIC(10, 2) NOT NULL,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Waste / Shrinkage Table (Mermas)
CREATE TABLE IF NOT EXISTS public.inventory_waste (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL, -- 'expired', 'damaged', 'dropped', 'poor_quality'
    cost_at_waste NUMERIC(10, 2), -- Cost of the lost items
    reported_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Trigger to update Ingredient cost and stock on purchase
CREATE OR REPLACE FUNCTION process_inventory_purchase()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    current_cost NUMERIC;
    v_new_stock NUMERIC;
BEGIN
    FOR item IN SELECT * FROM public.inventory_purchase_items WHERE purchase_id = NEW.id LOOP
        -- Get current data
        SELECT cost_per_unit, current_stock INTO current_cost, v_new_stock 
        FROM public.ingredients WHERE id = item.ingredient_id;
        
        -- Update stock
        UPDATE public.ingredients 
        SET current_stock = current_stock + item.quantity,
            cost_per_unit = item.unit_cost, -- Average costing could be implemented here too
            updated_at = NOW()
        WHERE id = item.ingredient_id;
        
        -- Record movement
        INSERT INTO public.inventory_movements (
            ingredient_id,
            movement_type,
            quantity,
            previous_stock,
            new_stock,
            cost,
            reference_id,
            reference_type,
            notes,
            created_by
        ) VALUES (
            item.ingredient_id,
            'purchase',
            item.quantity,
            v_new_stock,
            v_new_stock + item.quantity,
            item.unit_cost,
            NEW.id,
            'purchase',
            'Entrada por compra #' || COALESCE(NEW.invoice_number, 'N/A'),
            NEW.created_by
        );
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_process_inventory_purchase
    AFTER INSERT ON public.inventory_purchases
    FOR EACH ROW
    EXECUTE FUNCTION process_inventory_purchase();

-- 7. Trigger to deduct stock on waste
CREATE OR REPLACE FUNCTION process_inventory_waste()
RETURNS TRIGGER AS $$
DECLARE
    v_prev_stock NUMERIC;
BEGIN
    SELECT current_stock INTO v_prev_stock FROM public.ingredients WHERE id = NEW.ingredient_id;
    
    -- Update stock
    UPDATE public.ingredients 
    SET current_stock = current_stock - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.ingredient_id;
    
    -- Record movement
    INSERT INTO public.inventory_movements (
        ingredient_id,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        cost,
        reference_id,
        reference_type,
        notes,
        created_by
    ) VALUES (
        NEW.ingredient_id,
        'waste',
        -NEW.quantity,
        v_prev_stock,
        v_prev_stock - NEW.quantity,
        NEW.cost_at_waste,
        NEW.id,
        'waste',
        'Merma reportada: ' || NEW.reason,
        NEW.reported_by
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_process_inventory_waste
    AFTER INSERT ON public.inventory_waste
    FOR EACH ROW
    EXECUTE FUNCTION process_inventory_waste();

-- 8. RLS Policies
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_waste ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage suppliers" ON public.suppliers FOR ALL USING (public.user_has_permission(auth.uid(), 'MANAGE_SETTINGS'));
CREATE POLICY "Admins can manage purchases" ON public.inventory_purchases FOR ALL USING (public.user_has_permission(auth.uid(), 'MANAGE_SETTINGS'));
CREATE POLICY "Admins can manage purchase items" ON public.inventory_purchase_items FOR ALL USING (public.user_has_permission(auth.uid(), 'MANAGE_SETTINGS'));
CREATE POLICY "Admins can manage waste" ON public.inventory_waste FOR ALL USING (public.user_has_permission(auth.uid(), 'MANAGE_SETTINGS'));

-- Optional: Allow staff to view
CREATE POLICY "Staff can view suppliers" ON public.suppliers FOR SELECT USING (TRUE);

-- 9. Insert some demo suppliers
INSERT INTO public.suppliers (name, contact_name, category, phone) VALUES
('Pescadería El Puerto', 'Luis Marín', 'Pescados', '300-111-2222'),
('Fruber Central', 'Ana Goméz', 'Vegetales', '301-333-4444'),
('Carnes del Norte', 'Pedro Rojas', 'Carnes', '302-555-6666'),
('Distribuidora de Bebidas', 'Sonia López', 'Bebidas', '303-777-8888')
ON CONFLICT (name) DO NOTHING;
