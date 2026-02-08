
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkCajero() {
    console.log('--- REVISANDO PERFIL DE CAJERO ---');
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'cajero@pargorojo.com')
        .single();

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Datos del Cajero:', JSON.stringify(profile, null, 2));
    }

    console.log('\n--- REVISANDO CONFIGURACIÓN DE RLS ---');
    const { data: policies } = await supabase.rpc('exec_sql', {
        query: `SELECT policyname, qual FROM pg_policies WHERE tablename = 'profiles'`
    });
    console.log('Políticas en profiles:', policies);
}

checkCajero();
