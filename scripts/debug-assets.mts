
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function checkAssets() {
    console.log('Checking Asset table...')
    const assetCount = await prisma.asset.count()
    console.log(`Total Assets: ${assetCount}`)

    const assets = await prisma.asset.findMany({ take: 5 })
    console.log('Sample Assets:', JSON.stringify(assets, null, 2))

    // Check for orphaned assets or assets with potential formatting issues
    const entriesWithAssets = await prisma.entry.findMany({
        where: { images: { some: {} } },
        select: { id: true, title: true, _count: { select: { images: true } } }
    })
    console.log(`Entries with Assets: ${entriesWithAssets.length}`)
}

checkAssets()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
