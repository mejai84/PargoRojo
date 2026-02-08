
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fixCashbox() {
    console.log('--- REPARANDO CAJA PRINCIPAL ---');

    // 1. Obtener el restaurante del cajero
    const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('email', 'cajero@pargorojo.com')
        .single();

    if (!profile?.restaurant_id) {
        console.error('No se encontró restaurant_id para el cajero');
        return;
    }

    console.log('Restaurant ID:', profile.restaurant_id);

    // 2. Verificar si existe la Caja Principal
    const { data: cashboxes } = await supabase
        .from('cashboxes')
        .select('*')
        .eq('restaurant_id', profile.restaurant_id);

    console.log('Cajas actuales:', cashboxes);

    // 3. Crear o actualizar la Caja Principal
    const { data, error } = await supabase
        .from('cashboxes')
        .upsert({
            name: 'Caja Principal',
            restaurant_id: profile.restaurant_id,
            current_status: 'CLOSED',
            is_active: true
        }, { onConflict: 'name, restaurant_id' })
        .select();

    if (error) {
        console.error('Error creando caja:', error);
    } else {
        console.log('Caja lista:', data);
    }
}

fixCashbox();
