
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

async function applyMigration() {
    console.log('--- RECREANDO TABLAS DE WHATSAPP ---');

    const sqlFile = 'supabase_migrations/11_loyalty_whatsapp_engine.sql';
    const sql = fs.readFileSync(path.resolve(sqlFile), 'utf8');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
        console.log('✅ Migración aplicada exitosamente.');
    } else {
        const err = await response.json();
        console.error('❌ Error aplicando migración:', err);
    }
}

applyMigration();
