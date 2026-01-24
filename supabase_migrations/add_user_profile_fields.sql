-- Add new fields to profiles table for improved registration
-- Executing this multiple times is safe (IF NOT EXISTS)

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS address_reference TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS dietary_preferences TEXT[], -- Array for multiple preferences
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

-- Create index for city searches (useful for delivery zones)
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);

-- Create index for birth_date (useful for birthday promotions)
CREATE INDEX IF NOT EXISTS idx_profiles_birth_date ON public.profiles(birth_date);

COMMENT ON COLUMN public.profiles.address IS 'Primary delivery address for the user';
COMMENT ON COLUMN public.profiles.city IS 'City or neighborhood for delivery validation';
COMMENT ON COLUMN public.profiles.address_reference IS 'Additional references to help delivery (e.g., "Near the park")';
COMMENT ON COLUMN public.profiles.birth_date IS 'Date of birth for birthday promotions';
COMMENT ON COLUMN public.profiles.dietary_preferences IS 'Array of preferences like vegetarian, gluten-free, etc.';
COMMENT ON COLUMN public.profiles.terms_accepted IS 'Whether user accepted terms and conditions';
COMMENT ON COLUMN public.profiles.privacy_accepted IS 'Whether user accepted privacy policy';
