import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

// Load .env manually
if (!process.env.DATABASE_URL) {
    try {
        const envPath = path.resolve(process.cwd(), '.env')
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8')
            envConfig.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/)
                if (match) {
                    process.env[match[1].trim()] = match[2].trim().replace(/^"(.*)"$/, '$1')
                }
            })
        }
    } catch (e) { console.error("Failed to load .env", e) }
}

async function main() {
    console.log("Checking AppConfig rows via pg...")
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })

    try {
        const client = await pool.connect()
        try {
            const res = await client.query('SELECT * FROM "AppConfig"')
            console.log(`Found ${res.rows.length} AppConfig rows.`)

            res.rows.forEach((row, idx) => {
                console.log(`[${idx}] ID: ${row.id}, AutoBackup: ${row.enableAutoBackup}, Interval: ${row.autoBackupInterval}`)
            })

            if (res.rows.length > 1) {
                console.warn("WARNING: Multiple configuration rows found!")
            } else {
                console.log("Configuration looks correct (single row).")
            }
        } finally {
            client.release()
        }
    } catch (e) {
        console.error("Error:", e)
    } finally {
        await pool.end()
    }
}

main()
