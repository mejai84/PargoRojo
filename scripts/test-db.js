const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function test() {
    console.log('Testing connection...');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        const res = await client.query('SELECT NOW()');
        console.log('Connected!', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection failed:', err);
    }
}
test();
