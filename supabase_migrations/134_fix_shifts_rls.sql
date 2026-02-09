
-- REPARACIÓN DE RLS PARA TURNOS
-- Permite que administradores y dueños puedan cerrar turnos de cualquier empleado.

-- 1. Eliminar política restrictiva anterior si existe (opcional, mejor añadir una nueva)
-- DROP POLICY IF EXISTS "Cashiers can update own shifts" ON public.shifts;

-- 2. Crear política para administradores
CREATE POLICY "Admins can update all shifts" 
ON public.shifts FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
);

-- 3. Asegurar que también puedan insertar (si no existe ya una política amplia)
CREATE POLICY "Admins can insert shifts" 
ON public.shifts FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
);
