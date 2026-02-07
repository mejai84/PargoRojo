
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' }); // Cargar .env.local

const executeSQL = async () => {
    // 1. Verificar si DATABASE_URL existe
    let connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ ERROR: No se encontró DATABASE_URL en .env.local');
        process.exit(1);
    }

    // 2. Manejo especial de contraseña con '@' 
    // Si la contraseña tiene '@' sin codificar (e.g. @Mejai...) puede fallar.
    // Intentamos codificar si detectamos el patrón.
    if (connectionString.includes(':@')) {
        console.log('⚠️ Detectada contraseña con "@" inicial. Intentando codificación URL...');
        connectionString = connectionString.replace(':@', ':%40');
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false } // Necesario para Supabase
    });

    try {
        console.log('🔌 Conectando a Supabase...');
        await client.connect();
        console.log('✅ Conexión exitosa.');

        // 3. Ejecutar scripts de reparación
        const scripts = [
            'supabase_migrations/BREAK_GLASS_FIX.sql',
            'supabase_migrations/REGENERATE_ADMIN_USER_V2.sql'
        ];

        for (const scriptPath of scripts) {
            const absolutePath = path.resolve(scriptPath);
            if (fs.existsSync(absolutePath)) {
                console.log(`\n📂 Ejecutando: ${scriptPath}...`);
                const sql = fs.readFileSync(absolutePath, 'utf8');

                // Ejecutar transacción
                await client.query('BEGIN');
                await client.query(sql);
                await client.query('COMMIT');

                console.log(`✅ Script ejecutado correctamente.`);
            } else {
                console.warn(`⚠️ Script no encontrado: ${scriptPath}`);
            }
        }

        console.log('\n🎉 REPARACIÓN AUTOMATICA COMPLETADA.');
        console.log('👉 Por favor prueba LOGIN en LOCALHOST ahora.');

    } catch (err) {
        console.error('\n❌ ERROR AL EJECUTAR SCRIPT:', err);
        // Si hay error, intentar rollback por si acaso
        try { await client.query('ROLLBACK'); } catch (e) { }
    } finally {
        await client.end();
    }
};

executeSQL();
