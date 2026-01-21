-- Trigger and function to notify admins about new reservations
CREATE OR REPLACE FUNCTION notify_new_reservation()
RETURNS TRIGGER AS $$
DECLARE
    admin_user RECORD;
BEGIN
    -- Create notification for all admin users
    FOR admin_user IN 
        SELECT id FROM public.profiles 
        WHERE role = 'admin' OR role = 'staff' OR role = 'cashier'
    LOOP
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            admin_user.id,
            'new_reservation',
            '📅 Nueva Reserva Recibida',
            'Reserva de ' || NEW.customer_name || ' para el ' || NEW.reservation_date || ' a las ' || NEW.reservation_time,
            jsonb_build_object(
                'reservation_id', NEW.id,
                'customer_name', NEW.customer_name,
                'date', NEW.reservation_date,
                'time', NEW.reservation_time
            )
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to notify new reservations
DROP TRIGGER IF EXISTS trigger_notify_new_reservation ON reservations;
CREATE TRIGGER trigger_notify_new_reservation
    AFTER INSERT ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_reservation();
