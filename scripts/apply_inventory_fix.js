
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function applyFix() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const sql = fs.readFileSync(path.join(__dirname, '../supabase_migrations/135_inventory_pro_tables.sql'), 'utf8');
        await client.query(sql);
        console.log('Migración 135 aplicada correctamente.');
    } catch (err) {
        console.error('Error aplicando migración:', err);
    } finally {
        await client.end();
    }
}

applyFix();
