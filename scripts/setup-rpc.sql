
-- Crear la función exec_sql para permitir ejecución remota de scripts (solo para service_role/admins)
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
  RETURN json_build_object('status', 'success');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$;

-- Otorgar permisos solo a roles autenticados de alto nivel (o service_role implícitamente)
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
