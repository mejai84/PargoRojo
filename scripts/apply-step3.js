
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

async function applyFixes() {
    const scripts = [
        'supabase_migrations/step3-disable-rls-debug.sql'
    ];

    for (const scriptPath of scripts) {
        const absolutePath = path.resolve(scriptPath);
        if (!fs.existsSync(absolutePath)) {
            console.warn(`⚠️ Script no encontrado: ${scriptPath}`);
            continue;
        }

        console.log(`\n📂 Aplicando: ${scriptPath}...`);
        const sql = fs.readFileSync(absolutePath, 'utf8');

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
                console.log(`✅ Script ${scriptPath} aplicado exitosamente.`);
            } else {
                console.error(`❌ Error en ${scriptPath}:`, result);
            }
        } catch (err) {
            console.error(`❌ Error de red aplicando ${scriptPath}:`, err.message);
        }
    }
}

applyFixes();
