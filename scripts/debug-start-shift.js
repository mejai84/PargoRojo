
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function debugStartShift() {
    const userId = "1f48bed9-5346-4e45-95e7-e2ca74de031e"; // Cajero ID

    console.log('--- PASO 1: VERIFICAR PERFIL ---');
    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', userId)
        .single();

    if (pError) return console.error('Error perfil:', pError.message);
    console.log('Restaurant ID:', profile.restaurant_id);

    console.log('\n--- PASO 2: VERIFICAR DEFINICIONES ---');
    const { data: defs } = await supabase.from('shift_definitions').select('*');
    console.log('Definiciones:', defs);

    if (!defs || defs.length === 0) return console.error('No hay definiciones de turno.');
    const shiftDefinitionId = defs[0].id;

    console.log('\n--- PASO 3: INTENTAR INSERTAR TURNO ---');
    const { data, error } = await supabase
        .from('shifts')
        .insert({
            user_id: userId,
            restaurant_id: profile.restaurant_id, // SaaS Isolation
            shift_type: defs[0].name,
            shift_definition_id: shiftDefinitionId,
            status: 'OPEN',
            started_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('❌ ERROR AL INSERTAR:', error.message);
        console.error('Detalles:', error.details);
        console.error('Código:', error.code);
    } else {
        console.log('✅ ÉXITO:', data);
        // Limpiamos
        await supabase.from('shifts').delete().eq('id', data.id);
    }
}

debugStartShift();
