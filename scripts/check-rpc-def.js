
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkRpc() {
    const { data } = await supabase.rpc('query_sql', {
        query_text: "SELECT routine_definition FROM information_schema.routines WHERE routine_name = 'exec_sql'"
    });
    console.log('Exec SQL Definition:', data);

    const { data: q } = await supabase.rpc('query_sql', {
        query_text: "SELECT routine_definition FROM information_schema.routines WHERE routine_name = 'query_sql'"
    });
    console.log('Query SQL Definition:', q);
}

checkRpc();
