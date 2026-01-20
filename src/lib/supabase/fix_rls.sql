
-- 1. Permitir a cualquiera (autenticado o anónimo) CREAR pedidos
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Enable insert for everyone" ON public.orders FOR INSERT WITH CHECK (true);

-- 2. Permitir leer pedidos si eres el dueño (auth) O si tienes el ID (para pantalla de éxito, aunque idealmente se filtraría mejor)
-- Por ahora mantenemos la de auth, pero quizás necesites leer tu pedido recién creado siendo anónimo.
-- Una forma común es permitir leer si el pedido tiene tu session, pero Supabase anon no tiene ID estable.
-- Para el flow simple, permitimos insert publico.

-- 3. Permitir a cualquiera CREAR items de pedido
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Enable insert items for everyone" ON public.order_items FOR INSERT WITH CHECK (true);

-- 4. Permitir al ADMIN (o staff) ver/editar todos los pedidos (Para la cocina y el panel admin)
-- (Asumiendo que no tienes roles configurados, permitimos SELECT a todos los autenticados TEMPORALMENTE para que tu usuario admin pueda ver la cocina)
-- En produccion esto debe ser 'auth.role() = "admin"'
CREATE POLICY "Enable read for authenticated users only" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read items for authenticated users only" ON public.order_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.orders FOR UPDATE USING (auth.role() = 'authenticated');

-- NOTA: Si quieres que el usuario invitado VEA su pedido en la "Success Page", necesitaríamos devolver el pedido en la misma transacción o permitir lectura pública temporal. 
-- El insert actual devuelve datos (.select()), así que la policy de INSERT debe permitir devolver valores.
-- Supabase a veces requiere policy de SELECT para devolver datos tras INSERT.

CREATE POLICY "Enable select for everyone" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Enable select items for everyone" ON public.order_items FOR SELECT USING (true);
