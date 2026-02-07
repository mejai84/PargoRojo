-- =========================================================
-- CORRECCIÓN DE INSTANCE_ID Y CONTRASEÑA
-- Objetivo: Alinear los usuarios de prueba con el Admin que sí funciona
-- =========================================================

DO $$
DECLARE
    v_correct_instance_id UUID;
BEGIN
    -- 1. Obtener el instance_id correcto desde el usuario admin
    SELECT instance_id INTO v_correct_instance_id 
    FROM auth.users 
    WHERE email LIKE '%jajl840316@gmail.com%' 
    LIMIT 1;

    -- Si no encontramos admin, usamos el default (pero avisamos)
    IF v_correct_instance_id IS NULL THEN
        RAISE NOTICE '⚠️ No se encontró usuario admin. Usando default 0000...';
        v_correct_instance_id := '00000000-0000-0000-0000-000000000000';
    ELSE
        RAISE NOTICE '✅ Instance ID detectado: %', v_correct_instance_id;
    END IF;

    -- 2. Actualizar los usuarios de prueba con el ID correcto
    UPDATE auth.users
    SET instance_id = v_correct_instance_id,
        aud = 'authenticated',
        role = 'authenticated',
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        -- Forzamos contraseña bcrypt estándar (cost 10) que es lo más compatible
        encrypted_password = crypt('password123', gen_salt('bf', 10))
    WHERE email IN ('clara.caja@pargorojo.com', 'marcos.mesero@pargorojo.com', 'carlos.chef@pargorojo.com', 'admin.demo@pargorojo.com');

    RAISE NOTICE '✅ Usuarios actualizados con instance_id correcto y pass password123';
END $$;

NOTIFY pgrst, 'reload config';
