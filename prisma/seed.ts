import { seedAdminUser } from '../lib/seed-utils'
import { prisma } from '../lib/prisma'

async function main() {
    await seedAdminUser()
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

