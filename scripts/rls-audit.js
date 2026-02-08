
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkRLS() {
    console.log('--- RLS STATUS ---');
    const tables = ['shift_definitions', 'shifts', 'profiles', 'restaurants', 'settings'];
    for (const table of tables) {
        const { data: res } = await supabase.rpc('query_sql', {
            query_text: `SELECT relname, relrowsecurity FROM pg_class WHERE relname = '${table}' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')`
        });
        console.log(`${table}:`, res?.[0]?.relrowsecurity ? 'ENABLED' : 'DISABLED');
    }

    console.log('\n--- POLICIES ---');
    const { data: policies } = await supabase.rpc('query_sql', {
        query_text: `SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public'`
    });
    policies?.forEach(p => console.log(`[${p.tablename}] ${p.policyname} (${p.cmd})`));
}

checkRLS();
