require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function applyKDSMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    })

    try {
        console.log('🔌 Conectando a Supabase...')
        await client.connect()
        console.log('✅ Conectado exitosamente\n')

        const migrationPath = path.join(__dirname, '..', 'supabase_migrations', '138_kds_pro_preparation_times.sql')
        const sql = fs.readFileSync(migrationPath, 'utf8')

        console.log('📋 Ejecutando migración KDS PRO...')
        console.log('━'.repeat(60))

        await client.query(sql)

        console.log('━'.repeat(60))
        console.log('✅ Migración KDS PRO aplicada exitosamente!\n')

        // Verificar que se agregó la columna
        console.log('🔍 Verificando cambios...')
        const { rows } = await client.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'products' AND column_name = 'preparation_time'
        `)

        if (rows.length > 0) {
            console.log('✅ Columna preparation_time creada:')
            console.log('   - Tipo:', rows[0].data_type)
            console.log('   - Default:', rows[0].column_default)
        }

        // Verificar índices
        const { rows: indexes } = await client.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'products' 
            AND (indexname = 'idx_products_prep_time' OR indexname = 'idx_products_station_time')
        `)

        console.log('\n✅ Índices creados:')
        indexes.forEach(idx => {
            console.log('   -', idx.indexname)
        })

        // Mostrar algunos productos con sus tiempos
        const { rows: products } = await client.query(`
            SELECT name, preparation_time 
            FROM products 
            LIMIT 5
        `)

        console.log('\n📊 Muestra de productos con tiempos:')
        products.forEach(p => {
            console.log(`   - ${p.name}: ${p.preparation_time} min`)
        })

        console.log('\n🎉 ¡KDS PRO está listo para usar!')

    } catch (error) {
        console.error('❌ Error aplicando migración:', error.message)
        process.exit(1)
    } finally {
        await client.end()
    }
}

applyKDSMigration()
