-- =========================================================
-- CORREGIR DATOS DE BUSINESS_INFO
-- El valor actual "{}" causa el crash en el frontend
-- =========================================================

UPDATE public.settings
SET value = '{"name": "Pargo Rojo", "tagline": "Gran Rafa | Experiencia Gastronómica de Mar", "address": "C.Cial. Cauca Centro, Caucasia", "phone": "320 784 8287", "email": "admin@pargorojo.com"}'
WHERE key = 'business_info';

-- Asegurar que logo_url no esté vacío si es posible (opcional)
-- UPDATE public.settings SET value = '/images/logo.png' WHERE key = 'logo_url';

-- Verificar el cambio
SELECT key, value FROM public.settings WHERE key = 'business_info';

SELECT '✅ DATOS DE NEGOCIO CORREGIDOS' as estado;
