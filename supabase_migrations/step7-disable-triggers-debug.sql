-- DESACTIVAR TRIGGERS PARA DESCARTAR
ALTER TABLE public.shifts DISABLE TRIGGER audit_shifts_trigger;
NOTIFY pgrst, 'reload schema';
