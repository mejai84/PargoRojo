-- PASO A PASO: DESBLOQUEO DE LECTURA Y BRANDING

-- 1. Desactivar RLS temporalmente en tablas críticas para asegurar acceso
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;

-- 2. Asegurar permisos de lectura para usuarios logueados
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.settings TO authenticated;
GRANT SELECT ON public.shift_definitions TO authenticated;
GRANT SELECT ON public.shifts TO authenticated;

-- 3. Actualizar Branding en la tabla de configuraciones para que aparezca "Jamali OS"
INSERT INTO public.settings (key, value, description)
VALUES (
    'business_info', 
    '{"name": "JAMALI OS", "logo_url": "https://ryxqoapxzvssxqdsyfzw.supabase.co/storage/v1/object/public/brand_assets/jamali_logo.png"}', 
    'Información básica del negocio'
)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;

-- 4. Forzar recarga de PostgREST
NOTIFY pgrst, 'reload schema';
