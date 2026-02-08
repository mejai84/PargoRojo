
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase.rpc('exec_sql', {
        query: `
            SELECT tablename, policyname, qual 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'profiles';
        `
    });
    console.log('Profiles Policies:', error ? error.message : data);

    const { data: func } = await supabase.rpc('exec_sql', {
        query: "SELECT routine_definition FROM information_schema.routines WHERE routine_name = 'get_my_restaurant_id'"
    });
    console.log('Function Def:', JSON.stringify(func, null, 2));
}
check();
