'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, subDays, isSameDay, format, getDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { getContentSnippet } from "@/lib/editor-utils"

export type InsightData = {
    totalEntries: number
    currentStreak: number
    longestStreak: number
    totalWords: number
    moodDistribution: { mood: string; count: number }[]
    dayDistribution: { day: string; count: number }[]
    tagsDistribution: { tag: string; count: number }[]
    locationDistribution: { location: string; count: number }[]
    updatedAt: Date
}

export async function getInsightsData(timezone: string = "UTC", force: boolean = false): Promise<InsightData | null> {
    const session = await auth()
    if (!session?.user?.id) return null

    const userId = session.user.id

    // 1. Check Cache First (unless forced)
    const userWithCache = await prisma.user.findUnique({
        where: { id: userId },
        select: { insightsData: true, insightsUpdatedAt: true }
    })

    const nowZoned = toZonedTime(new Date(), timezone)

    if (!force && userWithCache?.insightsData && userWithCache?.insightsUpdatedAt) {
        const lastUpdatedZoned = toZonedTime(userWithCache.insightsUpdatedAt, timezone)

        // If it was updated today (in the user's timezone), return the cached version!
        if (isSameDay(nowZoned, lastUpdatedZoned)) {
            console.log(`[Insights] Serving CACHED data for user: ${userId}`)
            const cachedData = userWithCache.insightsData as unknown as InsightData
            return {
                ...cachedData,
                updatedAt: userWithCache.insightsUpdatedAt
            }
        }
    }

    console.log(`[Insights] Calculating FRESH data for user: ${userId} (Force: ${force}, Cache outdated or missing)`)

    // Get User Journals
    const journals = await prisma.journal.findMany({
        where: { userId },
        select: { id: true }
    })
    const journalIds = journals.map(j => j.id)

    const entries = await prisma.entry.findMany({
        where: {
            journalId: { in: journalIds }
        },
        orderBy: {
            date: 'desc' // Newest first
        },
        // Exclude content here to prevent OOM on large datasets
        select: {
            id: true,
            date: true,
            mood: true,
            locationName: true,
            tags: {
                select: {
                    name: true
                }
            }
        }
    })

    // Helper to format a date in the user's timezone
    const formatInZone = (date: Date | string | number, fmt: string) => {
        return format(toZonedTime(date, timezone), fmt)
    }

    // 1. Total Entries
    const totalEntries = entries.length

    // 2. Streaks
    // Normalize dates to start of day strings for comparison, using Client Timezone
    const uniqueDates = Array.from(new Set(entries.map(e => formatInZone(e.date, 'yyyy-MM-dd')))).sort().reverse()

    let currentStreak = 0
    let longestStreak = 0

    if (uniqueDates.length > 0) {
        const now = new Date()
        const today = format(nowZoned, 'yyyy-MM-dd')
        const yesterday = format(subDays(nowZoned, 1), 'yyyy-MM-dd')

        // Check if streak is active (has entry today or yesterday)
        const lastEntryDateStr = uniqueDates[0]
        if (lastEntryDateStr === today || lastEntryDateStr === yesterday) {
            currentStreak = 1
            // Use date-fns-tz safely by ensuring the string is treated as local midnight
            let checkDate = new Date(lastEntryDateStr + 'T00:00:00')

            for (let i = 1; i < uniqueDates.length; i++) {
                const prevDate = format(subDays(checkDate, 1), 'yyyy-MM-dd')
                if (uniqueDates[i] === prevDate) {
                    currentStreak++
                    checkDate = subDays(checkDate, 1)
                } else {
                    break
                }
            }
        }

        // Calculate longest streak
        let tempStreak = 1
        for (let i = 0; i < uniqueDates.length - 1; i++) {
            const currentDateStr = uniqueDates[i]
            const nextDateInList = uniqueDates[i + 1]

            // Reconstruct date object safely
            const currentDate = new Date(currentDateStr + 'T00:00:00')
            const expectedPrevDate = format(subDays(currentDate, 1), 'yyyy-MM-dd')

            if (nextDateInList === expectedPrevDate) {
                tempStreak++
            } else {
                if (tempStreak > longestStreak) longestStreak = tempStreak
                tempStreak = 1
            }
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak
    }

    // 3. Total Words (Fetch in batches to prevent OOM)
    let totalWords = 0
    const batchSize = 10 // Reduced from 50 to tightly control memory spikes caused by giant image payloads
    const entryIds = entries.map(e => e.id)

    for (let i = 0; i < entryIds.length; i += batchSize) {
        const batchIds = entryIds.slice(i, i + batchSize)
        const batchEntries = await prisma.entry.findMany({
            where: { id: { in: batchIds } },
            select: { id: true, content: true }
        })

        batchEntries.forEach(entry => {
            const text = getContentSnippet(entry.content)
            const count = text.trim().split(/\s+/).filter(w => w.length > 0).length
            totalWords += count
        })

        // Yield the event loop to prevent server lockup on massive NAS DB reads
        await new Promise(r => setTimeout(r, 10))
    }

    // 4. Mood Distribution
    const moodMap = new Map<string, number>()
    entries.forEach(entry => {
        if (entry.mood) {
            moodMap.set(entry.mood, (moodMap.get(entry.mood) || 0) + 1)
        }
    })
    const moodDistribution = Array.from(moodMap.entries())
        .map(([mood, count]) => ({ mood, count }))
        .sort((a, b) => b.count - a.count)

    // 5. Last 7 Days Distribution
    const dayMap = new Map<string, number>()
    const last7Days: { date: string, label: string }[] = []

    for (let i = 6; i >= 0; i--) {
        const d = subDays(nowZoned, i)
        const dateKey = format(d, 'yyyy-MM-dd')
        const label = format(d, 'EEE') // Mon, Tue, etc.
        last7Days.push({ date: dateKey, label })
        dayMap.set(dateKey, 0)
    }

    // Pre-calculate word counts per date to avoid doing it twice or having invalid content
    // We already have batchEntries logic above, but to be efficient, let's map it.
    // Instead of completely rewriting, we'll just fetch full content for entries within the last 7 days only.
    const last7DaysEntries = await prisma.entry.findMany({
        where: {
            id: { in: entryIds },
            date: { gte: subDays(nowZoned, 7) }
        },
        select: { date: true, content: true }
    })

    last7DaysEntries.forEach(entry => {
        // Group by the User's Timezone Date
        const dateKey = formatInZone(entry.date, 'yyyy-MM-dd')
        if (dayMap.has(dateKey)) {
            const text = getContentSnippet(entry.content)
            const count = text.trim().split(/\s+/).filter(w => w.length > 0).length
            dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + count)
        }
    })

    const dayDistributionOrdered = last7Days.map(d => ({
        day: d.label,
        count: dayMap.get(d.date) || 0
    }))

    // 6. Tags Distribution
    const tagMap = new Map<string, number>()
    entries.forEach(entry => {
        entry.tags.forEach(tag => {
            tagMap.set(tag.name, (tagMap.get(tag.name) || 0) + 1)
        })
    })
    const tagsDistribution = Array.from(tagMap.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Top 10 tags

    // 7. Location Distribution
    const locationMap = new Map<string, number>()
    entries.forEach(entry => {
        if (entry.locationName) {
            locationMap.set(entry.locationName, (locationMap.get(entry.locationName) || 0) + 1)
        }
    })
    const locationDistribution = Array.from(locationMap.entries())
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Top 10 locations

    const finalData: InsightData = {
        totalEntries,
        currentStreak,
        longestStreak,
        totalWords,
        moodDistribution,
        dayDistribution: dayDistributionOrdered,
        tagsDistribution,
        locationDistribution,
        updatedAt: new Date()
    }

    // Save to Cache!
    await prisma.user.update({
        where: { id: userId },
        data: {
            insightsData: finalData as any,
            insightsUpdatedAt: new Date()
        }
    })

    return finalData
}
