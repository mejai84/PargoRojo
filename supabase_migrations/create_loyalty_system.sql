
-- Create loyalty points transaction history table
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL, -- points added (positive) or removed (negative)
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('order_reward', 'redemption', 'manual_adjustment', 'refund')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own loyalty history" ON public.loyalty_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all loyalty transactions" ON public.loyalty_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Trigger to keep profiles.loyalty_points in sync
CREATE OR REPLACE FUNCTION public.update_profile_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles
        SET loyalty_points = loyalty_points + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles
        SET loyalty_points = loyalty_points - OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_loyalty_transaction_change
    AFTER INSERT OR DELETE ON public.loyalty_transactions
    FOR EACH ROW EXECUTE PROCEDURE public.update_profile_loyalty_points();

-- Function to reward points on order (1 point per 1.000 COP)
CREATE OR REPLACE FUNCTION public.reward_order_points()
RETURNS TRIGGER AS $$
DECLARE
    points_to_add INTEGER;
BEGIN
    -- Only reward points for registered users and when order is delivered or paid
    IF NEW.user_id IS NOT NULL AND NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
        -- Calculate points: 1 point per 1000 of the total (integer division)
        points_to_add := FLOOR(NEW.total / 1000);
        
        IF points_to_add > 0 THEN
            INSERT INTO public.loyalty_transactions (user_id, order_id, amount, transaction_type, description)
            VALUES (NEW.user_id, NEW.id, points_to_add, 'order_reward', 'Puntos acumulados por el pedido #' || NEW.id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_delivered
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE public.reward_order_points();
