
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgresql://postgres:%40Mejai840316*.@[2600:1f1e:75b:4b02:a72e:c2e8:3230:8eb4]:5432/postgres";

async function runSQL(filePath) {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log(`Connected to database. Running ${filePath}...`);
        const sql = fs.readFileSync(filePath, 'utf8');

        // Split by semicolon might be dangerous for complex functions, but let's try simple first
        // Or just run the whole blob if it supports it.
        await client.query(sql);
        console.log(`✅ ${filePath} applied successfully.`);
    } catch (err) {
        console.error(`❌ Error applying ${filePath}:`, err.message);
    } finally {
        await client.end();
    }
}

async function main() {
    const file = process.argv[2];
    if (!file) {
        console.error("Usage: node run-migration.js <path_to_sql>");
        process.exit(1);
    }
    await runSQL(file);
}

main();
