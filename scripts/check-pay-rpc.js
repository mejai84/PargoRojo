
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkRpc() {
    const { data } = await supabase.rpc('query_sql', {
        query_text: "SELECT routine_definition, argument_data_type FROM information_schema.routines r JOIN (SELECT routine_name, string_agg(data_type, ', ') as argument_data_type FROM information_schema.parameters GROUP BY routine_name) p ON r.routine_name = p.routine_name WHERE r.routine_name = 'pay_order_atomic'"
    });
    console.log('RPC Definition:', data);
}

checkRpc();
