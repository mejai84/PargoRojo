
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar .env.local manualmente
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log('Checking shifts table columns...');
    const { data, error } = await supabase.from('shifts').select('*').limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns in shifts:', Object.keys(data[0]));
    } else {
        console.log('No data in shifts table. Checking columns via RPC or fallback...');
        // Try to insert a dummy row or check metadata
        const { data: cols, error: colError } = await supabase.rpc('exec_sql', {
            query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'shifts'"
        });
        if (colError) {
            console.log('exec_sql failed, trying direct select on information_schema (rest api might block this)');
            const { data: restCols, error: restError } = await supabase
                .from('shifts')
                .select()
                .limit(0)
                .then(r => ({ data: r.data })); // This doesn't help with column names if empty
            console.log('Could not determine columns. Table might be empty.');
        } else {
            console.log('Columns:', cols.map(c => c.column_name));
        }
    }
}

checkSchema();
