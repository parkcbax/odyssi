
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function checkAppConfigs() {
    console.log('Checking AppConfig table...')
    const configs = await prisma.appConfig.findMany({
        orderBy: { id: 'asc' }
    })

    console.log(`Total AppConfig rows: ${configs.length}`)

    configs.forEach((config, index) => {
        console.log(`\n--- Config #${index + 1} ---`)
        console.log('ID:', config.id)
        console.log('Analytic Snippet Length:', config.analyticSnippet ? config.analyticSnippet.length : 0)
        console.log('Auto Backup:', config.enableAutoBackup)
        console.log('Last Auto Backup:', config.lastAutoBackupAt)
        // console.log('Snippet:', config.analyticSnippet)
    })
}

checkAppConfigs()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect())
