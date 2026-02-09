
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const migrations = [
    'supabase_migrations/121_production_bugs_fix_part1.sql',
    'supabase_migrations/122_fix_analytics_functions.sql',
    'supabase_migrations/125_fix_tables_rls_and_permissions.sql',
    'supabase_migrations/step11-waiter-pin.sql',
    'supabase_migrations/128_fix_analytics_status_mismatch.sql',
    'supabase_migrations/129_repair_multi_tenancy.sql'
];

const regions = [
    'us-east-1',
    'eu-central-1',
    'eu-west-1',
    'sa-east-1',
    'ap-southeast-1',
    'us-west-1'
];

async function tryConnect(region) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const connectionString = `postgresql://postgres.ryxqoapxzvssxqdsyfzw:%40Mejai840316*.@${host}:6543/postgres?pgbouncer=true`;

    console.log(`Trying region: ${region} (${host})...`);

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000 // 5s timeout
    });

    try {
        await client.connect();
        console.log(`✅ Connected successfully to ${region}!`);
        return client;
    } catch (err) {
        console.log(`❌ Failed ${region}: ${err.message}`);
        await client.end();
        return null; // Continue to next region
    }
}

async function applyMigrations() {
    console.log("Detecting Supabase region via pooler connection...");

    let client = null;
    for (const region of regions) {
        client = await tryConnect(region);
        if (client) break;
    }

    if (!client) {
        console.error("❌ Could not connect to any known Supabase region via IPv4 pooler.");
        console.error("Please check your network settings or confirm the project region.");
        process.exit(1);
    }

    try {
        for (const file of migrations) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                console.log(`\n📄 Applying ${file}...`);
                const sql = fs.readFileSync(filePath, 'utf8');
                try {
                    await client.query(sql);
                    console.log(`✅ Success: ${file}`);
                } catch (e) {
                    console.error(`❌ Error in ${file}: ${e.message}`);
                }
            } else {
                console.warn(`⚠️ File not found: ${file}`);
            }
        }

        console.log("\n🔄 Reloading PostgREST schema cache...");
        try {
            await client.query("NOTIFY pgrst, 'reload schema';");
            console.log("✅ Schema reload notified.");
        } catch (e) {
            console.warn("⚠️ Schema reload might fail in transaction mode. Check API.");
        }

        console.log("\n🚀 All migrations processed.");

    } catch (err) {
        console.error("❌ Runtime error:", err);
    } finally {
        await client.end();
    }
}

applyMigrations();
