import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PromptCard } from "@/components/dashboard/prompt-card"
import { OnThisDayCard } from "@/components/dashboard/on-this-day-card"
import { RecentEntriesList } from "@/components/dashboard/recent-entries-list"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true }
    })

    // Fetch Recent Entries (latest 5)
    const recentEntries = await prisma.entry.findMany({
        where: {
            journal: { userId: session.user.id }
        },
        orderBy: { date: 'desc' },
        take: 5,
        include: { journal: true }
    })

    // Fetch "On This Day" entries (same month and day in previous years)
    const today = new Date()
    const month = today.getMonth() + 1 // Prisma/JS month is 0-indexed, but let's be careful with DB
    const day = today.getDate()

    // Note: This is a complex query for Prisma if we don't have month/day extracted.
    // We'll fetch all and filter for now if the dataset is small, or use a raw query.
    // For Odyssi, let's try a slightly better Prisma approach or raw query.

    // Simplest reliable way for SQLite/PG:
    const allEntries = await prisma.entry.findMany({
        where: {
            journal: { userId: session.user.id }
        },
        include: { journal: true }
    })

    const onThisDayEntries = allEntries.filter(entry => {
        const entryDate = new Date(entry.date)
        return entryDate.getMonth() === today.getMonth() &&
            entryDate.getDate() === today.getDate() &&
            entryDate.getFullYear() < today.getFullYear()
    })

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user?.name || "Traveler"}.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
                <PromptCard />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RecentEntriesList entries={recentEntries} />
                </div>
                <div className="lg:col-span-1">
                    <OnThisDayCard entries={onThisDayEntries} />
                </div>
            </div>
        </div>
    )
}
