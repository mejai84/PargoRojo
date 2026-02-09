
-- =====================================================
-- NORMALIZACIÓN PRO DE RECETAS (ESCANDALLOS)
-- =====================================================

-- 1. Renombrar receta actual a copia de seguridad si existe datos
-- (Asumimos que vamos a migrar o empezar limpio para esta versión PRO)

-- 2. Nueva tabla de Recetas (Cabecera)
CREATE TABLE IF NOT EXISTS public.recipes_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id),
    product_id UUID REFERENCES public.products(id), -- Opcional si es sub-receta
    name TEXT NOT NULL, -- Ej: "Hamburguesa Pargo" o "Salsa Base Blanca"
    description TEXT,
    is_sub_recipe BOOLEAN DEFAULT false, -- True si es una base para otras
    portions NUMERIC(10,2) DEFAULT 1, -- Para cuántas porciones rinde esta receta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Items de Receta (Cuerpo)
CREATE TABLE IF NOT EXISTS public.recipe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID REFERENCES public.recipes_new(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id),
    sub_recipe_id UUID REFERENCES public.recipes_new(id), -- Permite recursividad simple
    quantity NUMERIC(12,4) NOT NULL, -- Cantidad necesaria
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar RLS
ALTER TABLE public.recipes_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_items ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Admins manage recipes_new" ON public.recipes_new FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "Admins manage recipe_items" ON public.recipe_items FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- 5. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_recipe_product ON public.recipes_new(product_id);
CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe ON public.recipe_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_items_ing ON public.recipe_items(ingredient_id);
