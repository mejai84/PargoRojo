-- =========================================================
-- FORZADO DE CONTRASEÑA (Para asegurar acceso)
-- =========================================================

-- Actualizamos directamente la contraseña encriptada para Clara
UPDATE auth.users
SET encrypted_password = crypt('password123', gen_salt('bf')),
    email_confirmed_at = now() -- Asegurar que está confirmado
WHERE email = 'clara.caja@pargorojo.com';

-- Lo mismo para Marcos y Carlos, por si acaso
UPDATE auth.users
SET encrypted_password = crypt('password123', gen_salt('bf')),
    email_confirmed_at = now()
WHERE email IN ('marcos.mesero@pargorojo.com', 'carlos.chef@pargorojo.com', 'admin.demo@pargorojo.com');

-- RECARGAR
NOTIFY pgrst, 'reload config';

SELECT '✅ Contraseñas reseteadas a: password123' as estado;
