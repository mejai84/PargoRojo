-- =========================================================
-- CONFIRMACIÓN FORZADA DE EMPLEADOS
-- Objetivo: Auto-confirmar a clara.cajera y cualquier otro
-- =========================================================

BEGIN;

-- 1. Confirmar el email de TODOS los usuarios actuales (fecha de confirmación = ahora)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. Verificar si existe Clara (como cajera o caja)
SELECT id, email, email_confirmed_at FROM auth.users 
WHERE email LIKE 'clara%';

COMMIT;
