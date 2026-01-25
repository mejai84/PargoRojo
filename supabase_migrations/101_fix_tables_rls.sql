-- FIX Tables RLS - Para que las mesas se puedan crear/editar/eliminar

-- Habilitar RLS
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores
DROP POLICY IF EXISTS "Anyone can view tables" ON public.tables;
DROP POLICY IF EXISTS "Staff can manage tables" ON public.tables;
DROP POLICY IF EXISTS "Authenticated users can view tables" ON public.tables;
DROP POLICY IF EXISTS "Admins can manage tables" ON public.tables;

-- Nuevas políticas permisivas
CREATE POLICY "Anyone can view tables" 
ON public.tables FOR SELECT 
USING (true);

CREATE POLICY "Staff can manage tables" 
ON public.tables FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'owner', 'waiter', 'cashier')
    )
);

-- Force reload
NOTIFY pgrst, 'reload schema';
