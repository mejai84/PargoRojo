
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkCols() {
    const client = new Client({
        connectionString: "postgresql://postgres:%40Mejai840316*.@db.ryxqoapxzvssxqdsyfzw.supabase.co:5432/postgres",
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log('CONNECTED!');

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'shifts' 
            ORDER BY ordinal_position;
        `);
        console.log('Columns in shifts:');
        res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));

        await client.end();
    } catch (err) {
        console.error('ERROR:', err);
    }
}
checkCols();
