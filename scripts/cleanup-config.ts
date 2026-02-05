import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

if (!process.env.DATABASE_URL) {
    try {
        const envPath = path.resolve(process.cwd(), '.env')
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8')
            envConfig.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/)
                if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"(.*)"$/, '$1')
            })
        }
    } catch (e) { }
}

async function main() {
    console.log("Cleaning up duplicate AppConfig rows...")
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })

    try {
        const client = await pool.connect()
        try {
            const res = await client.query('SELECT * FROM "AppConfig" ORDER BY id DESC')
            if (res.rows.length <= 1) {
                console.log("No duplicates found.")
                return
            }

            console.log(`Found ${res.rows.length} rows. Keeping the latest one (ID: ${res.rows[0].id}).`)

            // Keep first, delete rest
            const toDelete = res.rows.slice(1).map(r => r.id)

            for (const id of toDelete) {
                console.log(`Deleting stale config: ${id}`)
                await client.query('DELETE FROM "AppConfig" WHERE id = $1', [id])
            }

            console.log("Cleanup complete.")

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
