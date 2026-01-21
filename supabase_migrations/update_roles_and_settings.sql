-- UPDATE ROLES AND PERMISSIONS
-- This script adds necessary check constraints for roles if they exist, or just comments on them.
-- It also ensures the settings table exists for feature flags.

-- 1. Update Profiles Role Check (if it exists as a constraint)
-- We try to drop it first just in case it was a strict enum
DO $$ BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin', 'staff', 'cashier', 'waiter', 'cook', 'cleaner'));

-- 2. Create Settings Table for Feature Flags (if not exists)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.settings (key, value, description)
VALUES 
    ('feature_flags', 
    '{
        "enable_kitchen_kds": true,
        "enable_waiter_pos": true,
        "enable_reservations": true,
        "enable_coupons": true,
        "require_cashier_approval": true
    }'::jsonb, 
    'Global feature flags for the application')
ON CONFLICT (key) DO NOTHING;

-- 3. RLS for Settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read settings" ON public.settings;
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true); -- Public can read flags (needed for UI logic)

DROP POLICY IF EXISTS "Admins manage settings" ON public.settings;
CREATE POLICY "Admins manage settings" ON public.settings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
