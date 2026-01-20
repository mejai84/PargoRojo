
-- Permitir a cualquiera ACTUALIZAR pedidos (Necesario para cambiar estados en Admin si no estás logueado como Super Admin)
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.orders;
CREATE POLICY "Enable update for everyone" ON public.orders FOR UPDATE USING (true);
