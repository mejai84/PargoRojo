
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testRLSImpersonation() {
    const userId = "1f48bed9-5346-4e45-95e7-e2ca74de031e"; // Cajero ID

    console.log('--- TEST: SELECT PROPIO PERFIL (COMO USUARIO) ---');
    const { data, error } = await supabase.rpc('query_sql', {
        query_text: `
            -- Simulamos el login del usuario
            SET LOCAL "request.jwt.claims" = '{"sub": "${userId}"}';
            SELECT id, email, role, restaurant_id FROM public.profiles WHERE id = '${userId}';
        `
    });

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Resultado Impersonado:', data);
    }
}

testRLSImpersonation();
