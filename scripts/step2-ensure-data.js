
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function ensureData() {
    const defaultId = 'd8616ce5-7651-44ea-814a-96f09e32e8be';

    console.log('--- VERIFICANDO RESTAURANTE ---');
    const { data: res } = await supabase.from('restaurants').select('*').eq('id', defaultId).single();
    if (!res) {
        console.log('Creando restaurante por defecto...');
        await supabase.from('restaurants').insert({
            id: defaultId,
            name: 'Jamali OS Default',
            subdomain: 'jamali'
        });
    } else {
        console.log('Restaurante existe:', res.name);
    }

    console.log('\n--- VERIFICANDO CAJERO ---');
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', 'cajero@pargorojo.com').single();
    if (profile) {
        if (profile.restaurant_id !== defaultId || profile.role !== 'cashier') {
            console.log('Actualizando perfil del cajero...');
            await supabase.from('profiles').update({
                restaurant_id: defaultId,
                role: 'cashier'
            }).eq('id', profile.id);
            console.log('Perfil actualizado.');
        } else {
            console.log('Perfil del cajero es correcto.');
        }
    }
}

ensureData();
