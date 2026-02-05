'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, subDays, isSameDay, format, getDay } from "date-fns"
import { getContentSnippet } from "@/lib/editor-utils"

export type InsightData = {
    totalEntries: number
    currentStreak: number
    longestStreak: number
    totalWords: number
    moodDistribution: { mood: string; count: number }[]
    dayDistribution: { day: string; count: number }[]
}

export async function getInsightsData(): Promise<InsightData | null> {
    const session = await auth()
    if (!session?.user?.id) return null

    const entries = await prisma.entry.findMany({
        where: {
            journal: {
                userId: session.user.id
            }
        },
        orderBy: {
            date: 'desc' // Newest first
        },
        select: {
            date: true,
            content: true,
            mood: true
        }
    })

    // 1. Total Entries
    const totalEntries = entries.length

    // 2. Streaks
    // Normalize dates to start of day strings for comparison
    const uniqueDates = Array.from(new Set(entries.map(e => format(startOfDay(e.date), 'yyyy-MM-dd')))).sort().reverse()

    let currentStreak = 0
    let longestStreak = 0

    if (uniqueDates.length > 0) {
        const today = format(startOfDay(new Date()), 'yyyy-MM-dd')
        const yesterday = format(subDays(startOfDay(new Date()), 1), 'yyyy-MM-dd')

        // Check if streak is active (has entry today or yesterday)
        const lastEntryDate = uniqueDates[0]
        if (lastEntryDate === today || lastEntryDate === yesterday) {
            currentStreak = 1
            // Count backwards from the most recent date
            let checkDate = new Date(lastEntryDate)

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
            const currentDate = new Date(uniqueDates[i])
            const nextDateInList = uniqueDates[i + 1]
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
        // Simple approximate word count
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

    // 5. Day of Week Distribution
    const dayMap = new Map<number, number>()
    // Initialize 0-6
    for (let i = 0; i < 7; i++) dayMap.set(i, 0)

    entries.forEach(entry => {
        const day = getDay(new Date(entry.date)) // 0 = Sunday
        dayMap.set(day, (dayMap.get(day) || 0) + 1)
    })

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayDistribution = Array.from(dayMap.entries())
        .map(([dayIndex, count]) => ({ day: days[dayIndex], count }))
    // Shift to start with Monday? Or keep Sunday. Let's keep Sunday as 0 but maybe order visually later.
    // Usually charts expect array. Let's return Mon-Sun order for chart.

    const dayDistributionOrdered = [
        ...dayDistribution.slice(1), // Mon-Sat
        dayDistribution[0] // Sun
    ]

    return {
        totalEntries,
        currentStreak,
        longestStreak,
        totalWords,
        moodDistribution,
        dayDistribution: dayDistributionOrdered
    }
}
