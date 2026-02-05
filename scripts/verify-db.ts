import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

// Load .env manually since we aren't using next dev
if (!process.env.DATABASE_URL) {
    try {
        const envPath = path.resolve(process.cwd(), '.env')
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8')
            envConfig.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/)
                if (match) {
                    const key = match[1].trim()
                    let value = match[2].trim()
                    // Remove quotes if present
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1)
                    }
                    process.env[key] = value
                }
            })
            console.log("Loaded .env file")
        }
    } catch (e) {
        console.error("Failed to load .env", e)
    }
}

async function main() {
    console.log("Checking Database Schema...")
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
        console.error("DATABASE_URL is missing!")
        return
    }

    // Mask password for logging
    const masked = connectionString.replace(/:([^:@]+)@/, ':****@')
    console.log(`Connecting to: ${masked}`)

    const pool = new Pool({ connectionString })

    try {
        const client = await pool.connect()
        console.log("Connected successfully.")

        try {
            // Check AppConfig columns
            const res = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'AppConfig';
            `)

            console.log("\nColumns in AppConfig table:")
            res.rows.forEach(row => {
                console.log(` - ${row.column_name} (${row.data_type})`)
            })

            const hasEnable = res.rows.some(r => r.column_name === 'enableAutoBackup')
            if (hasEnable) {
                console.log("\n✅ SUCCESS: 'enableAutoBackup' column exists.")
            } else {
                console.log("\n❌ EXTREME FAILURE: 'enableAutoBackup' column MISSING!")
            }

        } finally {
            client.release()
        }

    } catch (e) {
        console.error("Connection Error:", e)
    } finally {
        await pool.end()
    }
}

main()
