-- ==========================================
-- ACTUALIZACIÓN DE CONFIGURACIÓN DE EMPRESA
-- ==========================================

-- 1. Actualizar la información del negocio específica para Pargo Rojo
INSERT INTO public.settings (key, value, description) VALUES
('business_info', '{
    "business_name": "PARGO ROJO - GRAN RAFA",
    "identification_number": "NIT 900.000.000-1",
    "phone": "+57 300 000 0000",
    "email": "contacto@pargorojo.com",
    "address": "Carrera 10 # 20-30, Turbo, Antioquia",
    "website": "www.pargorojo.com",
    "is_open": true,
    "currency": "COP",
    "currency_symbol": "$"
}'::jsonb, 'Información comercial y legal del restaurante'),
('tax_settings', '{
    "tax_name": "IVA",
    "tax_percentage": 19,
    "consumption_tax": 8,
    "include_tax_in_price": true,
    "invoice_prefix": "PR",
    "invoice_start_number": 1001,
    "legal_text": "ESTA ES UNA FACTURA DE VENTA ELECTRÓNICA. GRACIAS POR SU COMPRA."
}'::jsonb, 'Configuración de impuestos y facturación')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value, 
    description = EXCLUDED.description;

-- 2. Asegurar que los perfiles tengan acceso a leer todas las settings
DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings;
CREATE POLICY "Anyone can read settings"
    ON public.settings FOR SELECT
    USING (true);

-- 3. Solo admins pueden editar
DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings"
    ON public.settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );
