
-- Agregar columna de PIN a perfiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS waiter_pin TEXT;

-- Comentario para documentación
COMMENT ON COLUMN public.profiles.waiter_pin IS 'PIN de 4 dígitos para acceso rápido al portal de meseros.';

-- Opcional: Trigger para asegurar que solo sean números y 4 dígitos (opcional por ahora para evitar bloqueos)
