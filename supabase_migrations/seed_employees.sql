-- Semilla de empleados ficticios para pruebas de nómina y turnos
-- Nota: En Supabase, los perfiles suelen estar ligados a auth.users. 
-- Para pruebas rápidas, insertamos directamente en profiles con IDs aleatorios.

INSERT INTO public.profiles (id, email, full_name, role, phone)
VALUES 
    (gen_random_uuid(), 'juan.mesero@pargorojo.com', 'Juan Perez', 'waiter', '3001234567'),
    (gen_random_uuid(), 'maria.cocina@pargorojo.com', 'Maria Garcia', 'cook', '3109876543'),
    (gen_random_uuid(), 'carlos.caja@pargorojo.com', 'Carlos Rodriguez', 'cashier', '3201112233'),
    (gen_random_uuid(), 'pedro.staff@pargorojo.com', 'Pedro Lopez', 'staff', '3154445566')
ON CONFLICT (email) DO NOTHING;
