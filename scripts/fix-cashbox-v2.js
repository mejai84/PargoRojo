
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fixCashboxAgain() {
    console.log('--- REPARANDO CAJA PRINCIPAL (REINTENTO) ---');

    const restaurantId = 'd8616ce5-7651-44ea-814a-96f09e32e8be';

    // 1. Intentar actualizar por nombre y restaurant_id si no podemos hacer upsert
    // Primero vemos si hay alguna sin restaurant_id
    const { data: orphans } = await supabase.from('cashboxes').select('*').is('restaurant_id', null);
    console.log('Orphans:', orphans);

    // 2. Forzar que la existente tenga el restaurant_id correcto y estado CLOSED
    const { data: updated, error } = await supabase
        .from('cashboxes')
        .update({
            restaurant_id: restaurantId,
            current_status: 'CLOSED'
        })
        .eq('name', 'Caja Principal');

    if (error) {
        console.error('Error actualizando:', error);
    } else {
        console.log('Actualización enviada.');
    }
}

fixCashboxAgain();
