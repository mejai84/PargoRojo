-- PASO A PASO: DESBLOQUEO DE CAJAS Y FIX ESTÉTICO

-- 1. Desactivar RLS en tablas de caja para asegurar que el cajero vea la "Caja Principal"
ALTER TABLE public.cashboxes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashbox_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements DISABLE ROW LEVEL SECURITY;

-- 2. Asegurar permisos de lectura/escritura para usuarios autenticados (hasta que refinemos RLS)
GRANT ALL ON public.cashboxes TO authenticated;
GRANT ALL ON public.cashbox_sessions TO authenticated;
GRANT ALL ON public.cash_movements TO authenticated;

-- 3. Forzar recarga de esquema
NOTIFY pgrst, 'reload schema';
