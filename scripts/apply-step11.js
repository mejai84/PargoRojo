
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function applyMigration() {
    const sqlPath = path.join(__dirname, '..', 'supabase_migrations', 'step11-waiter-pin.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Aplicando migración PIN...');
    const { error } = await supabase.rpc('query_sql', { query_text: sql });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Migración aplicada exitosamente.');
    }
}

applyMigration();
