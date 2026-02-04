import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const admin = await prisma.user.upsert({
        where: { email: 'admin@odyssi.com' },
        update: {
            passwordHash: 'odyssi'
        },
        create: {
            email: 'admin@odyssi.com',
            name: 'Admin Traveler',
            passwordHash: 'odyssi',
            id: 'dev-admin'
        },
    })
    console.log('Admin user seeded:', admin)
}
main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
