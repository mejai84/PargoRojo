
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function inspectRLS() {
    console.log('--- INSPECCIONANDO POLÍTICAS DE PROFILES ---');
    // Usamos el API de Postgres directamente via un comando SELECT a pg_policies
    // Como no podemos correr SQL directo sin exec_sql, intentamos ver si exec_sql nos da el JSON
    const { data: res, error } = await supabase.rpc('exec_sql', {
        query: `
            SELECT json_agg(p) as policies 
            FROM (
                SELECT policyname, cmd, qual, with_check 
                FROM pg_policies 
                WHERE tablename = 'profiles'
            ) p;
        `
    });

    if (error) {
        console.error('Error:', error.message);
    } else {
        const policies = res[0]?.policies || [];
        if (policies.length === 0) {
            console.log('No se encontraron políticas activas en profiles.');
        } else {
            policies.forEach(p => {
                console.log(`\nPolítica: ${p.policyname}`);
                console.log(`Comando: ${p.cmd}`);
                console.log(`Filtro (USING): ${p.qual}`);
                console.log(`Check (WITH CHECK): ${p.with_check}`);
            });
        }
    }
}

inspectRLS();
