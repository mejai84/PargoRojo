
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ryxqoapxzvssxqdsyfzw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkProducts() {
    console.log('--- TEST: QUERY PRODUCTS ---');
    const { data, error } = await supabase
        .from('products')
        .select('id, name, category_id, image_url, price')
        .is('deleted_at', null)
        .eq('is_available', true)
        .limit(8);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Products:', data);
    }
}

checkProducts();
