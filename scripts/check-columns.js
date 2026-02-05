const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("Connecting to DB...")

    // Check if we can connect
    try {
        await prisma.$connect()
        console.log("Connected!")
    } catch (e) {
        console.error("Connection failed:", e)
        return
    }

    // Inspect columns using raw SQL (Postgres specific)
    try {
        const result = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'AppConfig';
        `
        console.log("Columns in AppConfig:", result)

        // Check finding simple
        console.log("Attempting findFirst...")
        const config = await prisma.appConfig.findFirst()
        console.log("AppConfig Row:", config)

    } catch (e) {
        console.error("Query failed:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
