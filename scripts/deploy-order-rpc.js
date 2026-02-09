const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function deploy() {
    console.log('Deploying Order RPC function...');

    // Read SQL file
    const sqlPath = path.join(__dirname, '../supabase_migrations/129_create_order_rpc.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        await client.query(sql);
        console.log('✅ Function create_order_v2 deployed successfully!');
    } catch (err) {
        console.error('❌ Error deploying function:', err);
    } finally {
        await client.end();
    }
}

deploy();
