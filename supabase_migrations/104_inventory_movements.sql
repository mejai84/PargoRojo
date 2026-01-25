-- Inventory Movements Table
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID REFERENCES public.ingredients(id),
    user_id UUID REFERENCES public.profiles(id),
    type VARCHAR(20) CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT')),
    quantity NUMERIC(10,2) NOT NULL,
    cost_per_unit NUMERIC(10,2),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view inventory movements" 
ON public.inventory_movements FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner', 'manager', 'cook')
    )
);

CREATE POLICY "Staff can create inventory movements" 
ON public.inventory_movements FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner', 'manager', 'cook')
    )
);
