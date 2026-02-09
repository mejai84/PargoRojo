
const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
    // Use connection string from env if available, otherwise construct it
    // Usually DATABASE_URL or direct params
    // Let's check .env.local content first if possible, or assume typical naming

    const client = new Client({
        connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:54322/postgres" // Default for local supabase
    });

    try {
        await client.connect();
        console.log('Connected to DB');
        const sql = fs.readFileSync('supabase_migrations/133_fix_payroll_schema.sql', 'utf8');
        await client.query(sql);
        console.log('Migration applied successfully');
    } catch (err) {
        console.error('Error applying migration:', err.message);
    } finally {
        await client.end();
    }
}

applyMigration();
