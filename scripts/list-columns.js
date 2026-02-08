
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

async function listColumns(tableName) {
    console.log(`Listing columns for ${tableName}...`);
    const sql = `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}'`;

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ query: sql })
        });

        const result = await response.json();
        if (response.ok) {
            console.table(result);
        } else {
            console.error(`❌ Error:`, result);
        }
    } catch (err) {
        console.error(`❌ Error de red:`, err.message);
    }
}

async function run() {
    await listColumns('shifts');
    await listColumns('shift_definitions');
}

run();
