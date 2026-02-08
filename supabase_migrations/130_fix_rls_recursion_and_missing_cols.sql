-- ========================================================
-- MIGRACIÓN 130: FIX DEFINITIVO MULTI-TENANCY & RLS RECURSION
-- Fecha: 8 de febrero de 2026
-- Propósito: Añadir restaurant_id faltante en tablas core y evitar recursión en RLS.
-- ========================================================

-- 1. Función get_my_restaurant_id robusta y sin recursión
-- Nota: SECURITY DEFINER hace que corra como el owner (postgres), saltándose RLS.
CREATE OR REPLACE FUNCTION public.get_my_restaurant_id()
RETURNS UUID AS $$
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Asegurar restaurant_id en tablas que faltaban
DO $$ 
DECLARE 
    tbl_name TEXT;
    target_res_id UUID := 'd8616ce5-7651-44ea-814a-96f09e32e8be';
    tables_to_fix TEXT[] := ARRAY[
        'settings', 'categories', 'products', 'tables', 'orders'
    ];
BEGIN 
    FOREACH tbl_name IN ARRAY tables_to_fix LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl_name AND column_name = 'restaurant_id') THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id)', tbl_name);
                EXECUTE format('UPDATE public.%I SET restaurant_id = %L WHERE restaurant_id IS NULL', tbl_name, target_res_id);
                -- EXECUTE format('ALTER TABLE public.%I ALTER COLUMN restaurant_id SET NOT NULL', tbl_name);
            END IF;
        END IF;
    END LOOP;
END $$;

-- 3. Corregir política de profiles para EVITAR RECURSIÓN
-- Eliminamos la política anterior que usaba get_my_restaurant_id() sobre sí misma
DROP POLICY IF EXISTS "SaaS Isolation Selection" ON public.profiles;
DROP POLICY IF EXISTS "SaaS Isolation Insertion" ON public.profiles;
DROP POLICY IF EXISTS "SaaS Isolation Update" ON public.profiles;
DROP POLICY IF EXISTS "SaaS Isolation Delete" ON public.profiles;

-- Nueva política para profiles:
-- Un usuario siempre puede ver su propio perfil.
CREATE POLICY "Profiles self visibility" ON public.profiles FOR SELECT USING (auth.uid() = id);
-- Admins pueden ver perfiles de su mismo restaurante (usando subquery que SECURITY DEFINER maneja bien)
CREATE POLICY "Profiles tenant visibility" ON public.profiles FOR SELECT 
USING (restaurant_id = (SELECT p.restaurant_id FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1));

-- 4. Asegurar RLS en settings con la columna ya existente
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SaaS Isolation Selection" ON public.settings;
CREATE POLICY "SaaS Isolation Selection" ON public.settings FOR SELECT 
USING (restaurant_id = public.get_my_restaurant_id() OR restaurant_id IS NULL);

-- 5. Recargar esquema
NOTIFY pgrst, 'reload schema';
