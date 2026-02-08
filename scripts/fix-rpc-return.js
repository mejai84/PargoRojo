
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fixExecSql() {
    console.log('--- REPARANDO EXEC_SQL PARA QUE DEVUELVA DATOS ---');
    const sql = `
        CREATE OR REPLACE FUNCTION public.exec_sql(query_text text)
        RETURNS JSON
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            result JSON;
        BEGIN
            EXECUTE format('SELECT json_agg(t) FROM (%s) t', query_text) INTO result;
            RETURN result;
        EXCEPTION WHEN OTHERS THEN
            RETURN json_build_object('error', SQLERRM);
        END;
        $$;
    `;

    // Intentamos mandarlo via el exec_sql actual (que aunque no devuelva el resultado del query, sí debería ejecutarlo)
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
        console.error('Error reparando:', error.message);
    } else {
        console.log('✅ exec_sql reparado. Ahora debería devolver resultados en formato JSON.');
    }
}

fixExecSql();
