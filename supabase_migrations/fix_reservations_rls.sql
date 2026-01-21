-- FIXED RLS FOR RESERVATIONS
-- This ensures that anyone (authenticated or anon) can create a reservation.

-- 1. Enable RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing to avoid conflicts
DROP POLICY IF EXISTS "Anyone can create a reservation" ON public.reservations;
DROP POLICY IF EXISTS "Admin can manage all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;

-- 3. Create NEW Policies
-- ALLOW INSERT for everyone (the check true is the key)
CREATE POLICY "Enable insert for all" 
ON public.reservations FOR INSERT 
WITH CHECK (true);

-- ALLOW SELECT for the user who made it (if they were logged in)
CREATE POLICY "Users view own" 
ON public.reservations FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'staff', 'cashier')
));

-- ALLOW ADMINS full access
CREATE POLICY "Admins full access" 
ON public.reservations FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff', 'cashier')
    )
);
