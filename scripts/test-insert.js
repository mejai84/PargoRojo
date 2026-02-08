
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testInsert() {
    console.log('Testing insert into shifts without restaurant_id...');

    const { data, error } = await supabase
        .from('shifts')
        .insert({
            user_id: '237fdee7-56b0-47a1-8708-cad15cf2b335',
            shift_type: 'TEST',
            shift_definition_id: 'd8616ce5-7651-44ea-814a-96f09e32e8be', // Fake UUID
            status: 'OPEN',
            started_at: new Date().toISOString()
        })
        .select();

    if (error) {
        console.error('INSERT ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('INSERT SUCCESS:', data);
    }
}

testInsert();
