-- MIGRACIÓN DE PERSONALIZACIÓN AVANZADA SaaS
-- Añade campos necesarios para fidelización, impuestos y WhatsApp a la tabla de restaurantes.

DO $$ 
BEGIN 
    -- 1. Campos de Fidelización
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'loyalty_points_per_1000') THEN
        ALTER TABLE public.restaurants ADD COLUMN loyalty_points_per_1000 INTEGER DEFAULT 1;
    END IF;

    -- 2. Campos Fiscales
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'currency_symbol') THEN
        ALTER TABLE public.restaurants ADD COLUMN currency_symbol VARCHAR(10) DEFAULT '$';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'tax_percentage') THEN
        ALTER TABLE public.restaurants ADD COLUMN tax_percentage DECIMAL(5,2) DEFAULT 0;
    END IF;

    -- 3. Campos de WhatsApp y Bot
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'whatsapp_number') THEN
        ALTER TABLE public.restaurants ADD COLUMN whatsapp_number VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'enable_whatsapp_receipts') THEN
        ALTER TABLE public.restaurants ADD COLUMN enable_whatsapp_receipts BOOLEAN DEFAULT FALSE;
    END IF;

    -- 4. Campos de Horario (JSONB para flexibilidad)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'business_hours') THEN
        ALTER TABLE public.restaurants ADD COLUMN business_hours JSONB DEFAULT '{"monday": {"open": "08:00", "close": "22:00", "closed": false}}';
    END IF;

END $$;

NOTIFY pgrst, 'reload schema';
