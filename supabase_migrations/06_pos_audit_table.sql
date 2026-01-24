-- =============================================
-- ARQUEOS PARCIALES (CASHBOX AUDITS)
-- =============================================

CREATE TABLE IF NOT EXISTS public.cashbox_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashbox_session_id UUID REFERENCES public.cashbox_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    
    -- Montos contados por el cajero
    counted_amount NUMERIC(12,2) NOT NULL,
    system_amount NUMERIC(12,2) NOT NULL, -- Lo que el sistema decía en ese momento
    difference_amount NUMERIC(12,2) GENERATED ALWAYS AS (counted_amount - system_amount) STORED,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.cashbox_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view audits" ON public.cashbox_audits 
    FOR SELECT USING (public.user_has_permission(auth.uid(), 'VIEW_REPORTS') OR user_id = auth.uid());

CREATE POLICY "Cashiers can create audits" ON public.cashbox_audits 
    FOR INSERT WITH CHECK (public.user_has_permission(auth.uid(), 'MANAGE_CASH_MOVEMENTS'));

-- Comentario
COMMENT ON TABLE public.cashbox_audits IS 'Registros de arqueo parcial sin cierre de caja';
