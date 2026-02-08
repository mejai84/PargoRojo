
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function inspectRLS() {
    console.log('--- INSPECCIONANDO POLÍTICAS (REINTENTO 2) ---');
    const { data: policies, error } = await supabase.rpc('query_sql', {
        query_text: `
            SELECT policyname, tablename, cmd, qual, with_check 
            FROM pg_policies 
            WHERE schemaname = 'public'
        `
    });

    if (error) {
        console.error('Error:', error.message);
    } else {
        if (!policies || policies.length === 0) {
            console.log('No se encontraron políticas activas.');
        } else {
            console.log(`Se encontraron ${policies.length} políticas:`);
            policies.forEach(p => {
                console.log(`\n[${p.tablename}] ${p.policyname} (${p.cmd})`);
                if (p.qual) console.log(`  USING: ${p.qual}`);
                if (p.with_check) console.log(`  WITH CHECK: ${p.with_check}`);
            });
        }
    }
}

inspectRLS();
