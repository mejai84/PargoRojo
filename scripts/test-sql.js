
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testCreate() {
    console.log('--- TEST CREATE ---');
    const sql = "CREATE TABLE IF NOT EXISTS public.test_table (id uuid primary key default gen_random_uuid(), name text);";
    const { data, error } = await supabase.rpc('query_sql', { query_text: sql });
    console.log('Result:', data, error);

    const { data: list } = await supabase.rpc('query_sql', { query_text: "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_table'" });
    console.log('Final check:', list);
}

testCreate();
