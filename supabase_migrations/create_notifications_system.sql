-- Sistema de Notificaciones en Tiempo Real
-- Tabla principal de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Habilitar Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politica: Los usuarios solo pueden ver sus propias notificaciones
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Politica: Los usuarios pueden marcar sus notificaciones como leidas
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Politica: Solo el sistema puede crear notificaciones (a traves de triggers)
CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- Funcion para crear notificacion cuando se crea un nuevo pedido
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
    admin_user RECORD;
BEGIN
    -- Crear notificacion para todos los usuarios admin
    FOR admin_user IN 
        SELECT id FROM auth.users 
        WHERE raw_user_meta_data->>'role' = 'admin'
    LOOP
        INSERT INTO notifications (user_id, order_id, type, title, message, data)
        VALUES (
            admin_user.id,
            NEW.id,
            'new_order',
            '🔔 Nuevo Pedido',
            'Pedido #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' - $' || NEW.total::TEXT,
            jsonb_build_object(
                'order_id', NEW.id,
                'total', NEW.total,
                'status', NEW.status
            )
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificar nuevos pedidos
DROP TRIGGER IF EXISTS trigger_notify_new_order ON orders;
CREATE TRIGGER trigger_notify_new_order
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_order();

-- Funcion para notificar cambios de estado del pedido
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    status_message TEXT;
    status_title TEXT;
BEGIN
    -- Solo notificar si el estado cambio
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Determinar el mensaje segun el nuevo estado
        CASE NEW.status
            WHEN 'preparing' THEN
                status_title := '👨‍🍳 Pedido en Preparación';
                status_message := 'Tu pedido está siendo preparado';
            WHEN 'ready' THEN
                status_title := '✅ Pedido Listo';
                status_message := 'Tu pedido está listo para recoger';
            WHEN 'delivered' THEN
                status_title := '🎉 Pedido Entregado';
                status_message := '¡Gracias por tu compra! Esperamos que disfrutes tu comida';
            WHEN 'cancelled' THEN
                status_title := '❌ Pedido Cancelado';
                status_message := 'Tu pedido ha sido cancelado';
            ELSE
                status_title := '📦 Actualización de Pedido';
                status_message := 'El estado de tu pedido ha cambiado';
        END CASE;
        
        -- Crear notificacion para el usuario que hizo el pedido (si existe)
        IF NEW.user_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, order_id, type, title, message, data)
            VALUES (
                NEW.user_id,
                NEW.id,
                'order_status_change',
                status_title,
                status_message || ' - Pedido #' || SUBSTRING(NEW.id::TEXT, 1, 8),
                jsonb_build_object(
                    'order_id', NEW.id,
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'total', NEW.total
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificar cambios de estado
DROP TRIGGER IF EXISTS trigger_notify_order_status_change ON orders;
CREATE TRIGGER trigger_notify_order_status_change
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_order_status_change();

-- Funcion para limpiar notificaciones antiguas (mas de 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
