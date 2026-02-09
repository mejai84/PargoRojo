const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
    console.log("Checking restaurants...");
    const { data: res, error: err1 } = await supabase.from('restaurants').select('id, name, subdomain');
    if (err1) console.error("Error res:", err1);
    console.table(res);

    console.log("Checking profiles...");
    const { data: prof, error: err2 } = await supabase.from('profiles').select('id, role, full_name').limit(5);
    if (err2) console.error("Error prof:", err2);
    console.table(prof);
}

run();
