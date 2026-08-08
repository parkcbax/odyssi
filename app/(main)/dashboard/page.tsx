import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PromptCard } from "@/components/dashboard/prompt-card"
import { OnThisDayCard } from "@/components/dashboard/on-this-day-card"
import { RecentEntriesList } from "@/components/dashboard/recent-entries-list"

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const resolvedParams = await searchParams
    const selectedDateParam = typeof resolvedParams.date === 'string' ? resolvedParams.date : undefined

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

    // Fetch all entries dates for the user (IDs + dates only, to avoid OOM)
    const allEntriesDates = await prisma.entry.findMany({
        where: {
            journal: { userId: session.user.id }
        },
        select: { id: true, date: true }
    })

    // Determine selected month/day. Defaults to today.
    let selectedMonth: number
    let selectedDay: number
    if (selectedDateParam) {
        const parsed = new Date(selectedDateParam)
        if (!isNaN(parsed.getTime())) {
            selectedMonth = parsed.getMonth() + 1
            selectedDay = parsed.getDate()
        } else {
            const now = new Date()
            selectedMonth = now.getMonth() + 1
            selectedDay = now.getDate()
        }
    } else {
        const now = new Date()
        selectedMonth = now.getMonth() + 1
        selectedDay = now.getDate()
    }

    // "On This Day" entries: same month/day in previous years
    const onThisDayEntryIds = allEntriesDates.filter(entry => {
        const entryDate = new Date(entry.date)
        return entryDate.getMonth() + 1 === selectedMonth &&
            entryDate.getDate() === selectedDay &&
            entryDate.getFullYear() < new Date().getFullYear()
    }).map(e => e.id)

    // Now securely fetch only the full matching entries
    const onThisDayEntries = await prisma.entry.findMany({
        where: { id: { in: onThisDayEntryIds } },
        orderBy: { date: 'desc' },
        include: { journal: true }
    })

    // The card only uses month/day, so a fixed reference year avoids rollover edge cases
    const initialDate = new Date(2000, selectedMonth - 1, selectedDay)

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
                    <OnThisDayCard entries={onThisDayEntries} initialDate={initialDate} />
                </div>
            </div>
        </div>
    )
}
