
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConn() {
    const client = new Client({
        connectionString: "postgresql://postgres:%40Mejai840316*.@[2600:1f1e:75b:4b02:a72e:c2e8:3230:8eb4]:5432/postgres",
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log('CONNECTED TO DB!');
        const res = await client.query('SELECT current_user;');
        console.log('USER:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('CONN ERROR:', err);
    }
}
testConn();
