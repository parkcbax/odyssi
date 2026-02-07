const { PrismaClient } = require('@prisma/client')
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')

async function main() {
    console.log("Setting up Prisma Client with Adapter...")
    const connectionString = process.env.DATABASE_URL
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    console.log("Prisma Client initialized.")

    // Log connection URL for debugging
    console.log(`Connecting to URL: ${connectionString}`)

    const email = process.env.ADMIN_EMAIL || 'p@rk.ci'
    console.log(`Checking entries for email: ${email}`)

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        console.log("User not found!")
        const allUsers = await prisma.user.findMany()
        console.log("Users in DB:", allUsers.map(u => u.email))
        return
    }

    console.log(`User ID: ${user.id}`)

    const journals = await prisma.journal.findMany({
        where: { userId: user.id }
    })
    console.log(`Journals found: ${journals.length}`)
    journals.forEach(j => console.log(` - Journal ID: ${j.id}, Name: ${j.name}`))

    // Check raw count of entries
    const allEntriesCount = await prisma.entry.count()
    console.log(`Total entries in DB (for ALL): ${allEntriesCount}`)

    // Check user entries count through relation
    const userEntriesCount = await prisma.entry.count({
        where: {
            journal: {
                userId: user.id
            }
        }
    })
    console.log(`Entries for USER ${user.email}: ${userEntriesCount}`)

    if (userEntriesCount === 0) {
        // Check if entries exist for the journal ID but not via User relation
        if (journals.length > 0) {
            const journalEntries = await prisma.entry.count({
                where: { journalId: journals[0].id }
            })
            console.log(`Entries for FIRST JOURNAL (${journals[0].id}): ${journalEntries}`)
        }
    } else {
        const entries = await prisma.entry.findMany({
            where: { journal: { userId: user.id } },
            take: 5,
            orderBy: { date: 'desc' }
        })
        console.log("Top 5 User Entries:")
        entries.forEach(e => console.log(` - ID: ${e.id}, Date: ${e.date.toISOString()}, Mood: ${e.mood}`))
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
