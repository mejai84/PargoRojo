-- Update reservations status constraint to include 'completed'
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));

-- Ensure columns match what's expected in the UI
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservations' AND column_name='num_people') THEN
        ALTER TABLE public.reservations RENAME COLUMN guests TO num_people;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservations' AND column_name='customer_phone') THEN
        ALTER TABLE public.reservations RENAME COLUMN phone TO customer_phone;
    END IF;
END $$;
