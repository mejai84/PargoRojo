
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkShifts() {
    console.log('--- REVISANDO ESTRUCTURA TRAS MIGRACIÓN ---');
    const { data, error } = await supabase.from('shifts').select('*').limit(1);

    if (error) {
        console.error('Error al leer shifts:', error.message);
        // Intentar ver columnas mediante un error provocado
        const { error: err2 } = await supabase.from('shifts').insert({ id: '00000000-0000-0000-0000-000000000000' });
        console.log('Detalles del error (si falló):', err2?.message);
    } else {
        const dummyRow = data[0] || {};
        console.log('Columnas encontradas en shifts:', Object.keys(dummyRow).length > 0 ? Object.keys(dummyRow) : 'Tabla vacía (no puedo ver columnas con SELECT *)');

        // Verificación activa: ¿Podemos insertar un turno con restaurant_id?
        console.log('\n--- PRUEBA DE INSERCIÓN ACTIVA ---');
        const testShift = {
            user_id: '237fdee7-56b0-47a1-8708-cad15cf2b335',
            restaurant_id: 'd8616ce5-7651-44ea-814a-96f09e32e8be',
            shift_type: 'General',
            status: 'OPEN',
            started_at: new Date().toISOString()
        };

        const { error: insError, data: insData } = await supabase.from('shifts').insert(testShift).select();
        if (insError) {
            console.error('❌ LA INSERCIÓN SIGUE FALLANDO:', insError.message);
            console.error('Detalles:', insError.details);
        } else {
            console.log('✅ INSERCIÓN EXITOSA EN DB:', insData);
            // Limpiar
            await supabase.from('shifts').delete().eq('id', insData[0].id);
        }
    }
}

checkShifts();
