// @ts-nocheck
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    // Hardcode for testing or use process.env
    const email = process.env.ADMIN_EMAIL || 'p@rk.ci'
    console.log(`Checking entries for email: ${email}`)

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        console.log("User not found!")
        return
    }

    console.log(`User ID: ${user.id}`)

    const journals = await prisma.journal.findMany({
        where: { userId: user.id }
    })
    console.log(`Journals found: ${journals.length}`)
    journals.forEach(j => console.log(` - Journal ID: ${j.id}, Name: ${j.name}`))

    // Count all entries
    const allEntriesCount = await prisma.entry.count()
    console.log(`Total entries in DB (for all users): ${allEntriesCount}`)

    // Count user entries using relation
    const userEntries = await prisma.entry.findMany({
        where: {
            journal: {
                userId: user.id
            }
        },
        select: {
            id: true,
            date: true,
            mood: true,
            journalId: true
        },
        orderBy: { date: 'desc' },
        take: 5
    })

    const userEntriesCount = await prisma.entry.count({
        where: {
            journal: {
                userId: user.id
            }
        }
    })

    console.log(`Total entries for user: ${userEntriesCount}`)
    if (userEntries.length > 0) {
        console.log("Latest 5 entries:")
        userEntries.forEach(e => {
            console.log(` - Entry ID: ${e.id}, Date: ${e.date.toISOString()}, Mood: ${e.mood}, JournalID: ${e.journalId}`)
        })
    } else {
        console.log("No entries found for log user.")
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
