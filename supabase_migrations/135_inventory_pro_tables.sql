
-- =====================================================
-- REPARACIÓN INTEGRAL DE INVENTARIO Y COSTEO
-- =====================================================

-- 1. Proveedores
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id),
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    category TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Compras (Purchases)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id),
    supplier_id UUID REFERENCES public.suppliers(id),
    invoice_number TEXT,
    total_amount NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
    received_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Detalle de Compra (Items)
CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id),
    quantity NUMERIC(12,4) NOT NULL,
    unit_cost NUMERIC(15,2) NOT NULL,
    subtotal NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Reportes de Merma (Waste)
CREATE TABLE IF NOT EXISTS public.waste_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id),
    ingredient_id UUID REFERENCES public.ingredients(id),
    quantity NUMERIC(12,4) NOT NULL,
    reason TEXT, -- 'expired', 'bad_handling', 'return', 'other'
    cost_at_waste NUMERIC(15,2), -- Costo del ingrediente en el momento de la merma
    user_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Asegurar RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_reports ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para Admins
CREATE POLICY "Admins manage suppliers" ON public.suppliers FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "Admins manage purchases" ON public.purchases FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "Admins manage purchase items" ON public.purchase_items FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "Admins manage waste" ON public.waste_reports FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- 6. Indices
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON public.purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_waste_ingredient ON public.waste_reports(ingredient_id);
