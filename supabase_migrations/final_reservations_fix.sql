-- DEFINITIVE FIX FOR RESERVATIONS RLS AND TRIGGER PERMISSIONS
-- This script fixes the RLS and ensures the trigger runs with elevated permissions

-- 1. Ensure the trigger function has SECURITY DEFINER
-- This is crucial so that anonymous users can trigger notifications without needing direct access to the notifications table
CREATE OR REPLACE FUNCTION notify_new_reservation()
RETURNS TRIGGER AS $$
DECLARE 
    admin_record RECORD;
BEGIN
    -- Create notification for all staff/admins
    FOR admin_record IN 
        SELECT id FROM public.profiles 
        WHERE role IN ('admin', 'staff', 'cashier', 'manager')
    LOOP
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            admin_record.id,
            'new_reservation',
            '📅 Nueva Reserva',
            'Reserva de ' || NEW.customer_name || ' para el ' || NEW.reservation_date || ' a las ' || NEW.reservation_time,
            jsonb_build_object(
                'reservation_id', NEW.id,
                'customer_name', NEW.customer_name
            )
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER allows it to run as the owner (admin)

-- 2. Clean up and Reset RLS for reservations
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create a reservation" ON public.reservations;
DROP POLICY IF EXISTS "Permitir crear reservas a todos" ON public.reservations;
DROP POLICY IF EXISTS "Admin and Staff gestion total" ON public.reservations;
DROP POLICY IF EXISTS "Admin y Staff gestion total" ON public.reservations;
DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Usuarios ven sus propias reservas" ON public.reservations;
DROP POLICY IF EXISTS "Enable insert for all" ON public.reservations;
DROP POLICY IF EXISTS "Users view own" ON public.reservations;
DROP POLICY IF EXISTS "Admins full access" ON public.reservations;

-- Policy: Allow ANYONE to insert
CREATE POLICY "public_insert_reservations" 
ON public.reservations FOR INSERT 
WITH CHECK (true);

-- Policy: Allow users to see their own (link by user_id)
CREATE POLICY "user_select_own_reservations" 
ON public.reservations FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Allow Admins/Staff full access
CREATE POLICY "staff_manage_reservations" 
ON public.reservations FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff', 'cashier', 'manager')
    )
);

-- 3. Also ensure Notifications table allows the insert from the trigger (which runs as definer)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "system_insert_notifications" ON public.notifications FOR INSERT WITH CHECK (true);
