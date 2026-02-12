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
}

export async function getInsightsData(timezone: string = "UTC"): Promise<InsightData | null> {
    const session = await auth()
    if (!session?.user?.id) return null

    // Get User Journals first
    const journals = await prisma.journal.findMany({
        where: { userId: session.user.id },
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
        select: {
            date: true,
            content: true,
            mood: true,
            locationName: true,
            tags: {
                select: {
                    name: true
                }
            }
        }
    })

    console.log(`[Insights] User: ${session.user.id}, Journals: ${journalIds.length}, Entries: ${entries.length}, Timezone: ${timezone}`)

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
        const today = formatInZone(now, 'yyyy-MM-dd')
        const yesterday = formatInZone(subDays(toZonedTime(now, timezone), 1), 'yyyy-MM-dd')

        // Check if streak is active (has entry today or yesterday)
        const lastEntryDate = uniqueDates[0]
        if (lastEntryDate === today || lastEntryDate === yesterday) {
            currentStreak = 1
            let checkDate = toZonedTime(lastEntryDate, timezone)

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

            // Reconstruct date object from string to safely subtract day
            const currentDate = new Date(currentDateStr)
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

    // 3. Total Words
    let totalWords = 0
    entries.forEach(entry => {
        const text = getContentSnippet(entry.content)
        const count = text.trim().split(/\s+/).filter(w => w.length > 0).length
        totalWords += count
    })

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

    const nowZoned = toZonedTime(new Date(), timezone)

    for (let i = 6; i >= 0; i--) {
        const d = subDays(nowZoned, i)
        const dateKey = format(d, 'yyyy-MM-dd')
        const label = format(d, 'EEE') // Mon, Tue, etc.
        last7Days.push({ date: dateKey, label })
        dayMap.set(dateKey, 0)
    }

    entries.forEach(entry => {
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

    console.log("[Insights] Last 7 Days:", JSON.stringify(dayDistributionOrdered))

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

    return {
        totalEntries,
        currentStreak,
        longestStreak,
        totalWords,
        moodDistribution,
        dayDistribution: dayDistributionOrdered,
        tagsDistribution,
        locationDistribution
    }
}
