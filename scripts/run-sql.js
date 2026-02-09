const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const query = process.argv[2];

if (!query) {
    console.error('Usage: node run-sql.js "SQL_QUERY"');
    process.exit(1);
}

async function run() {
    const { data, error } = await supabase.rpc('query_sql', {
        query_text: query
    });

    if (error) {
        console.error('Error:', error);
    } else {
        console.table(data);
    }
}

run();
