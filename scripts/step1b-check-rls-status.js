
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkRLSEnabled() {
    const { data: res, error } = await supabase.rpc('exec_sql', {
        query: `
            SELECT relname, relrowsecurity 
            FROM pg_class 
            WHERE relname = 'profiles' 
            AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        `
    });
    console.log('RLS Status for profiles:', res);
}

checkRLSEnabled();
