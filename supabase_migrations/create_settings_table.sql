-- Create settings table for business configuration
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
    ('business_info', '{
        "business_name": "Pozu 2.0",
        "phone": "+34 600 000 000",
        "email": "info@pozu.com",
        "address": "Calle Principal, 123",
        "is_open": true
    }'::jsonb),
    ('business_hours', '{
        "monday": {"open": "12:00", "close": "23:00", "closed": false},
        "tuesday": {"open": "12:00", "close": "23:00", "closed": false},
        "wednesday": {"open": "12:00", "close": "23:00", "closed": false},
        "thursday": {"open": "12:00", "close": "23:00", "closed": false},
        "friday": {"open": "12:00", "close": "23:00", "closed": false},
        "saturday": {"open": "12:00", "close": "23:00", "closed": false},
        "sunday": {"open": "12:00", "close": "23:00", "closed": false}
    }'::jsonb),
    ('delivery_settings', '{
        "delivery_fee": 2.50,
        "min_order_amount": 10.00,
        "free_delivery_threshold": 25.00
    }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read settings
CREATE POLICY "Anyone can read settings"
    ON settings FOR SELECT
    TO authenticated, anon
    USING (true);

-- Policy: Only admins can update settings
CREATE POLICY "Only admins can update settings"
    ON settings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
