-- =========================================================
-- REPARAR EMPLEADOS CREADOS CON ROL CUSTOMER
-- Objetivo: Convertir usuarios internos marcados como customer
--           al rol correcto según su email o nombre
-- =========================================================

BEGIN;

-- 1. Ver usuarios sospechosos (creados recientemente, email interno, rol customer)
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role as rol_actual,
    p.created_at,
    '⚠️ POSIBLE EMPLEADO MAL CLASIFICADO' as estado
FROM public.profiles p
WHERE 
    p.role = 'customer'
    AND (
        p.email ILIKE '%pargorojo.com'  -- Emails internos
        OR p.email ILIKE '%@pargo%'
        OR p.full_name ILIKE '%cajera%'
        OR p.full_name ILIKE '%cajero%'
        OR p.full_name ILIKE '%mesero%'
        OR p.full_name ILIKE '%mesera%'
        OR p.full_name ILIKE '%cocina%'
        OR p.full_name ILIKE '%cocinero%'
        OR p.full_name ILIKE '%chef%'
    )
    AND p.created_at > NOW() - INTERVAL '7 days'  -- Últimos 7 días
ORDER BY p.created_at DESC;

-- 2. REPARACIÓN AUTOMÁTICA
-- Esto asignará roles basándose en patrones del nombre/email

-- 2.1 Cajeros
UPDATE public.profiles
SET role = 'cashier'
WHERE 
    role = 'customer'
    AND (
        full_name ILIKE '%cajera%' 
        OR full_name ILIKE '%cajero%'
        OR email ILIKE '%caja%'
        OR email ILIKE '%cashier%'
    )
    AND created_at > NOW() - INTERVAL '7 days';

-- 2.2 Meseros
UPDATE public.profiles
SET role = 'waiter'
WHERE 
    role = 'customer'
    AND (
        full_name ILIKE '%mesero%' 
        OR full_name ILIKE '%mesera%'
        OR email ILIKE '%mesero%'
        OR email ILIKE '%waiter%'
    )
    AND created_at > NOW() - INTERVAL '7 days';

-- 2.3 Cocina
UPDATE public.profiles
SET role = 'cook'
WHERE 
    role = 'customer'
    AND (
        full_name ILIKE '%cocina%' 
        OR full_name ILIKE '%cocinero%'
        OR full_name ILIKE '%chef%'
        OR email ILIKE '%cocina%'
        OR email ILIKE '%cook%'
        OR email ILIKE '%chef%'
    )
    AND created_at > NOW() - INTERVAL '7 days';

COMMIT;

-- 3. VERIFICACIÓN POST-REPARACIÓN
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    CASE 
        WHEN p.role = 'cashier' THEN '✅ CAJERO/A'
        WHEN p.role = 'waiter' THEN '✅ MESERO/A'
        WHEN p.role = 'cook' THEN '✅ COCINERO/A'
        WHEN p.role = 'admin' THEN '✅ ADMIN'
        WHEN p.role = 'customer' THEN '⚠️ AÚN CUSTOMER'
        ELSE '❓ ' || p.role
    END as estado_final
FROM public.profiles p
WHERE p.created_at > NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC;

-- 4. Mensaje de resultado
SELECT 
    '✅ REPARACIÓN COMPLETADA' as mensaje,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'cashier' AND created_at > NOW() - INTERVAL '7 days') as cajeros_reparados,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'waiter' AND created_at > NOW() - INTERVAL '7 days') as meseros_reparados,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'cook' AND created_at > NOW() - INTERVAL '7 days') as cocineros_reparados,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'customer' AND email ILIKE '%pargorojo.com' AND created_at > NOW() - INTERVAL '7 days') as aun_pendientes;

-- =========================================================
-- NOTA IMPORTANTE:
-- - Este script arregla empleados creados en los últimos 7 días
-- - AHORA, al crear nuevos empleados desde /admin/employees,
--   el rol se guardará correctamente gracias al fix en el código
-- =========================================================
