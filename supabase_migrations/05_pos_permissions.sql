-- =============================================
-- PERMISOS PARA EL MOTOR POS (POS ENGINE)
-- Complemento al sistema RBAC
-- =============================================

-- 1. Insertar nuevos permisos si no existen
INSERT INTO public.permissions (name, description, category) VALUES
('OPEN_CASH', 'Permite realizar la apertura de una caja registradora', 'pos'),
('CLOSE_CASH', 'Permite realizar el cierre de una caja registradora (Arqueo Final)', 'pos'),
('MANAGE_CASH_MOVEMENTS', 'Permite registrar ingresos y egresos de efectivo manuales', 'pos'),
('VIEW_CASH_SESSIONS', 'Permite ver el historial y estado de las sesiones de caja', 'pos'),
('SELL_POS', 'Permite realizar ventas directas desde el punto de venta', 'pos'),
('VOID_SALE', 'Permite anular ventas ya realizadas (Nivel Supervisor)', 'pos'),
('FORCE_CASH_TRANSFER', 'Permite forzar el traspaso de una caja abierta por otro usuario', 'pos')
ON CONFLICT (name) DO NOTHING;

-- 2. Asignar permisos a roles existentes

-- Cajero (cashier)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'cashier' 
AND p.name IN ('OPEN_CASH', 'CLOSE_CASH', 'MANAGE_CASH_MOVEMENTS', 'VIEW_CASH_SESSIONS', 'SELL_POS')
ON CONFLICT DO NOTHING;

-- Administrador (admin) - Acceso total
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'admin' 
AND p.name IN ('OPEN_CASH', 'CLOSE_CASH', 'MANAGE_CASH_MOVEMENTS', 'VIEW_CASH_SESSIONS', 'SELL_POS', 'VOID_SALE', 'FORCE_CASH_TRANSFER')
ON CONFLICT DO NOTHING;

-- Mesero (waiter) - Solo vender si aplica, pero usualmente no maneja caja
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'waiter' 
AND p.name IN ('SELL_POS')
ON CONFLICT DO NOTHING;

-- 3. Actualizar políticas RLS de POS para usar estos nombres exactos (opcional si ya coinciden)
-- Nota: En 04_pos_engine_tables.sql usé minúsculas en algunos casos, mejor normalizar a mayúsculas.
