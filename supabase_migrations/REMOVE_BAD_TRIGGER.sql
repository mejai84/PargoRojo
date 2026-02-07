-- =========================================================
-- SOLUCIÓN DE TRIGGER: ELIMINAR PROBABLE CAUSA
-- Objetivo: Quitar el trigger que falla al crear perfil
-- =========================================================

BEGIN;

-- 1. Identificar y borrar el trigger común
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Asegurar que la función también se quite si es necesario (opcional)
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Asegurar que el search_path de autenticación sea correcto
ALTER ROLE authenticator SET search_path TO public, extensions, auth;

-- 4. Una última recarga por si acaso
NOTIFY pgrst, 'reload config';

COMMIT;

SELECT '✅ TRIGGER ELIMINADO. Prueba el login ahora.' as estado;
