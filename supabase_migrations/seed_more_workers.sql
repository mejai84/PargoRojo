-- Semilla extendida de empleados para pruebas masivas
-- Roles validos: 'user', 'admin', 'staff', 'cashier', 'waiter', 'cook', 'cleaner'

INSERT INTO public.profiles (id, email, full_name, role, phone)
VALUES 
    -- Meseros (Waiters)
    (gen_random_uuid(), 'andres.mesero@pargorojo.com', 'Andrés Martínez', 'waiter', '3011234567'),
    (gen_random_uuid(), 'luisa.mesera@pargorojo.com', 'Luisa Fernanda Torres', 'waiter', '3019876543'),
    (gen_random_uuid(), 'mateo.mesero@pargorojo.com', 'Mateo Gómez', 'waiter', '3024567890'),
    
    -- Cocina (Cooks)
    (gen_random_uuid(), 'elena.chef@pargorojo.com', 'Elena Rodríguez', 'cook', '3101112233'),
    (gen_random_uuid(), 'mario.auxiliar@pargorojo.com', 'Mario Benítez', 'cook', '3104445566'),
    
    -- Caja (Cashiers)
    (gen_random_uuid(), 'ana.caja@pargorojo.com', 'Ana María López', 'cashier', '3207778899'),
    
    -- Staff General
    (gen_random_uuid(), 'julian.limpieza@pargorojo.com', 'Julián Castro', 'cleaner', '3005556677'),
    (gen_random_uuid(), 'sofia.logistica@pargorojo.com', 'Sofía Vergara', 'staff', '3112223344'),
    
    -- Administradores Adicionales (Admins)
    (gen_random_uuid(), 'gerencia.comercial@pargorojo.com', 'Gerencia Comercial', 'admin', '3000000001')

ON CONFLICT (email) DO NOTHING;
