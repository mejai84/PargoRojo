
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

async function forceCreateWhatsAppTables() {
    console.log('--- FORZANDO CREACIÓN DE TABLAS DE WHATSAPP ---');

    const sql = `
-- 1. Crear tabla de plantillas
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla de notificaciones
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

-- 3. Insertar todas las plantillas posibles (Marketing Pack)
INSERT INTO public.whatsapp_templates (slug, name, content, variables) VALUES
('welcome', 'Bienvenida Cliente Nuevo', '¡Hola {{customer_name}}! 🦀 Bienvenido a Pargo Rojo. Nos alegra tenerte con nosotros. Tu cuenta está activa y lista.', '["customer_name"]'),
('points_earned', 'Acumulación de Puntos', '¡Felicidades {{customer_name}}! 🎉 Has ganado {{earned_points}} puntos con tu compra. Tu saldo total es de {{total_points}} puntos.', '["customer_name", "earned_points", "total_points"]'),
('order_ready', 'Pedido Listo / Despacho', '¡{{customer_name}}, tu pedido ya está listo! 🛵 Nuestro repartidor va en camino. ¡Buen provecho!', '["customer_name"]'),
('nps_feedback', 'Calificación del Servicio', '¡Hola {{customer_name}}! ¿Cómo estuvo todo hoy? 🤔 Califícanos del 1 al 5 y recibe un postre en tu próxima visita.', '["customer_name"]'),
('happy_birthday', 'Especial Cumpleaños', '¡Feliz Cumpleaños {{customer_name}}! 🎂 Pargo Rojo tiene un regalo especial para ti. Ven hoy y reclama un 20% de descuento.', '["customer_name"]'),
('winback_expired', 'Recuperación Cliente (15 días)', '¡{{customer_name}}, te extrañamos en Pargo Rojo! 🦀 Hace tiempo que no nos visitas. Usa el código VOLVER y obtén un aperitivo gratis.', '["customer_name"]'),
('reservation_confirm', 'Confirmación de Reserva', '¡Hola {{customer_name}}! Tu reserva para el {{date}} a las {{time}} ha sido confirmada. ¡Te esperamos!', '["customer_name", "date", "time"]'),
('promo_flash', 'Oferta Relámpago', '¡SOLO POR HOY {{customer_name}}! ⚡ 2x1 en ceviches seleccionados. No te lo pierdas.', '["customer_name"]'),
('vip_invite', 'Invitación Evento VIP', '¡Hola {{customer_name}}! Eres de nuestros clientes top. Te invitamos a la cata exclusiva este viernes.', '["customer_name"]'),
('loyalty_redeem', 'Canje de Puntos', '¡{{customer_name}}, has canjeado {{points}} puntos con éxito! Disfruta de tu recompensa.', '["customer_name", "points"]')
ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content, variables = EXCLUDED.variables;

-- 4. Abrir permisos RLS para que el cajero pueda verlas
ALTER TABLE public.whatsapp_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notifications DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.customer_notifications TO authenticated;
`;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
        const result = await response.json();
        console.log('✅ Resultado:', result);
    } else {
        const err = await response.json();
        console.error('❌ Error fatal:', err);
    }
}

forceCreateWhatsAppTables();
