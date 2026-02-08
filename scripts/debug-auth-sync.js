
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function check() {
    const email = 'cajero@pargorojo.com';
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();

    console.log('--- ESTADO DEL PERFIL ---');
    console.log('ID:', profile.id);
    console.log('Email:', profile.email);
    console.log('Rol registrado en DB:', profile.role);
    console.log('Restaurant ID:', profile.restaurant_id);

    // Verificar si hay registros huérfanos en auth.users
    const { data: authUser, error: authErr } = await supabase.rpc('exec_sql', {
        query: `SELECT id, email, created_at FROM auth.users WHERE email = '${email}'`
    });
    console.log('\n--- ESTADO EN AUTH.USERS ---');
    console.log(authErr ? authErr.message : authUser);
}
check();
