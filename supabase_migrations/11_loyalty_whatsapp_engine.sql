-- =============================================
-- WHATSAPP EXPERIENCE LOOP & TEMPLATES
-- =============================================

CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL, -- 'welcome', 'points_earned', 'order_ready', 'nps_feedback'
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb, -- ['customer_name', 'points', 'order_id']
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial Templates
INSERT INTO public.whatsapp_templates (slug, name, content, variables) VALUES
('welcome', 'Bienvenida Pargo Rojo', '¡Hola {{customer_name}}! 🦀 Bienvenido a Pargo Rojo. Has sido registrado en nuestro club de lealtad Elite. Ya tienes {{points}} puntos listos para usar.', '["customer_name", "points"]'),
('points_earned', 'Puntos Acumulados', '¡Felicidades {{customer_name}}! 🎉 Por tu compra de hoy has ganado {{earned_points}} puntos. Tu saldo total es de {{total_points}} puntos.', '["customer_name", "earned_points", "total_points"]'),
('nps_feedback', 'Encuesta de Satisfacción', '¡Hola {{customer_name}}! ¿Qué tal estuvo tu experiencia hoy en Pargo Rojo? 🤔 Califícanos del 1 al 5 respondiendo este mensaje y gana 10 puntos extra.', '["customer_name"]'),
('order_ready', 'Pedido Listo', '¡{{customer_name}}, tu pedido ya está listo! 🛵 El repartidor va en camino a tu ubicación.', '["customer_name"]')
ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content;

-- Table to track sent notifications
CREATE TABLE IF NOT EXISTS public.customer_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    phone TEXT,
    template_slug TEXT REFERENCES public.whatsapp_templates(slug),
    content TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically queue a "Points Earned" message when a loyalty transaction occurs
CREATE OR REPLACE FUNCTION public.queue_loyalty_notification()
RETURNS TRIGGER AS $$
DECLARE
    cust_name TEXT;
    cust_phone TEXT;
    total_pts INTEGER;
    template_content TEXT;
    final_content TEXT;
BEGIN
    -- Get customer info
    SELECT full_name, phone, loyalty_points INTO cust_name, cust_phone, total_pts 
    FROM public.profiles WHERE id = NEW.user_id;

    IF cust_phone IS NOT NULL AND NEW.transaction_type = 'order_reward' THEN
        -- Get template
        SELECT content INTO template_content FROM public.whatsapp_templates WHERE slug = 'points_earned';
        
        -- Replace variables (Primitive simulation of interpolation)
        final_content := replace(template_content, '{{customer_name}}', cust_name);
        final_content := replace(final_content, '{{earned_points}}', NEW.amount::text);
        final_content := replace(final_content, '{{total_points}}', total_pts::text);

        -- Queue notification
        INSERT INTO public.customer_notifications (customer_id, phone, template_slug, content, status)
        VALUES (NEW.user_id, cust_phone, 'points_earned', final_content, 'pending');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_loyalty_transaction_notify
    AFTER INSERT ON public.loyalty_transactions
    FOR EACH ROW EXECUTE PROCEDURE public.queue_loyalty_notification();
