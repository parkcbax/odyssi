"use client"

import { useState, useMemo, useCallback, useEffect, type CSSProperties } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, isSameDay } from "date-fns"
import { ChevronLeft, ChevronRight, MessageSquare, Loader2, ExternalLink, Calendar } from "lucide-react"
import { EntryViewer } from "@/components/entry-viewer"
import { cn } from "@/lib/utils"

interface TimelineYearActivityProps {
    entries: any[]
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface ActivityEntry {
    id: string
    title: string
    date: string
    mood?: string
    locationName?: string
    journal?: { title: string; color: string }
    tags?: { name: string }[]
    content: any
}

/** Levels 0..4, colored via CSS var so it follows the user's accent color. */
const LEVEL_OPACITY = [0.15, 0.35, 0.55, 0.75, 1]

const LEGEND_LEVELS = [0, 1, 2, 3, 4]

function levelStyle(count: number): CSSProperties {
    const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 9 ? 3 : 4
    if (level === 0) return { backgroundColor: "var(--muted)" }
    return { backgroundColor: `var(--primary)`, opacity: LEVEL_OPACITY[level] }
}

export function TimelineYearActivity({ entries }: TimelineYearActivityProps) {
    const currentYear = new Date().getFullYear()
    const [year, setYear] = useState<number>(currentYear)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => new Date())
    const [dayEntries, setDayEntries] = useState<ActivityEntry[] | null>(null)
    const [loading, setLoading] = useState(false)

    const minYear = useMemo(() => {
        if (entries.length === 0) return currentYear
        return Math.min(...entries.map(e => new Date(e.date).getFullYear()))
    }, [entries, currentYear])

    // Count entries per day within the displayed year
    const counts = useMemo(() => {
        const map = new Map<string, number>()
        entries.forEach(entry => {
            const d = new Date(entry.date)
            if (d.getFullYear() !== year) return
            const key = format(d, "yyyy-MM-dd")
            map.set(key, (map.get(key) || 0) + 1)
        })
        return map
    }, [entries, year])

    const totalEntries = useMemo(() => {
        let total = 0
        counts.forEach(c => (total += c))
        return total
    }, [counts])

    // Build week columns: grid starts on the Sunday on/before Jan 1, ends on the Saturday on/after Dec 31
    const weeks = useMemo(() => {
        const start = new Date(year, 0, 1)
        const end = new Date(year, 11, 31)
        const firstDay = new Date(start)
        firstDay.setDate(firstDay.getDate() - firstDay.getDay()) // back to Sunday
        const lastDay = new Date(end)
        lastDay.setDate(lastDay.getDate() + (6 - lastDay.getDay())) // forward to Saturday

        const columns: Date[][] = []
        let week: Date[] = []
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
            week.push(new Date(d))
            if (week.length === 7) {
                columns.push(week)
                week = []
            }
        }
        if (week.length > 0) columns.push(week)
        return columns
    }, [year])

    // Month labels at the column containing the 1st of each month
    const monthLabels = useMemo(() => {
        return weeks
            .map((week, i) => {
                const firstOfMonth = week.find(d => d.getDate() === 1 && d.getFullYear() === year)
                return firstOfMonth ? { index: i, label: format(firstOfMonth, "MMM") } : null
            })
            .filter((x): x is { index: number; label: string } => x !== null)
    }, [weeks, year])

    const fetchDayEntries = useCallback(async (date: Date) => {
        setLoading(true)
        setDayEntries(null)
        try {
            // Use the exact same client-side day matching as the graph counts,
            // so the list always matches what the graph shows for that day.
            const dayEntryIds = entries
                .filter(entry => isSameDay(new Date(entry.date), date))
                .map(entry => entry.id)
            if (dayEntryIds.length === 0) {
                setDayEntries([])
                setLoading(false)
                return
            }
            const res = await fetch(`/api/activity-entries?ids=${encodeURIComponent(dayEntryIds.join(','))}`)
            if (!res.ok) throw new Error("Failed to fetch")
            const data = await res.json()
            setDayEntries(data.entries || [])
        } catch (e) {
            console.error("Failed to load day entries:", e)
            setDayEntries([])
        } finally {
            setLoading(false)
        }
    }, [entries])

    const handleDayClick = useCallback((day: Date) => {
        const next = new Date(year, day.getMonth(), day.getDate())
        setSelectedDate(next)
        fetchDayEntries(next)
    }, [year, fetchDayEntries])

    const changeYear = useCallback((delta: number) => {
        const next = year + delta
        if (next > currentYear || next < minYear) return
        setYear(next)
        setSelectedDate(undefined)
        setDayEntries(null)
    }, [year, currentYear, minYear])

    // Default selection = today (only meaningful when the current year is shown)
    useEffect(() => {
        if (year === currentYear && !selectedDate) {
            const today = new Date()
            setSelectedDate(today)
            fetchDayEntries(today)
        }
    }, [year, currentYear, selectedDate, fetchDayEntries])

    const yearEntries = entries.filter(e => new Date(e.date).getFullYear() === year)

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => changeYear(-1)}
                                disabled={year <= minYear}
                                aria-label="Previous year"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-semibold w-14 text-center">{year}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => changeYear(1)}
                                disabled={year >= currentYear}
                                aria-label="Next year"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span>Less</span>
                            {LEGEND_LEVELS.map(l => (
                                <span
                                    key={l}
                                    className="h-[11px] w-[11px] rounded-[2px]"
                                    style={levelStyle(l === 0 ? 0 : [2, 5, 9, 999][l - 1])}
                                />
                            ))}
                            <span>More</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {/* Day-of-week labels */}
                        <div className="grid grid-rows-7 gap-[3px] pt-[18px] text-[9px] leading-[11px] text-muted-foreground w-7 shrink-0">
                            {WEEKDAYS.map(d => (
                                <span key={d}>{d}</span>
                            ))}
                        </div>

                        <div className="overflow-x-auto flex-1">
                            <div className="min-w-max">
                                {/* Month labels */}
                                <div
                                    className="grid grid-flow-col grid-rows-1 gap-[3px] mb-[3px] text-[9px] leading-[11px] text-muted-foreground"
                                    style={{ gridTemplateColumns: `repeat(${weeks.length}, 11px)` }}
                                >
                                    {weeks.map((_, i) => {
                                        const label = monthLabels.find(ml => ml.index === i)
                                        return (
                                            <span key={i} className="overflow-visible whitespace-nowrap">
                                                {label?.label || ""}
                                            </span>
                                        )
                                    })}
                                </div>

                                {/* Day cells */}
                                <div
                                    className="grid grid-flow-col grid-rows-7 gap-[3px]"
                                    style={{ gridTemplateColumns: `repeat(${weeks.length}, 11px)` }}
                                >
                                    {weeks.map((week, wi) =>
                                        week.map(day => {
                                            const key = format(day, "yyyy-MM-dd")
                                            const count = counts.get(key) || 0
                                            const inYear = day.getFullYear() === year
                                            const isSelected = !!selectedDate && isSameDay(day, selectedDate)
                                            return (
                                                <button
                                                    key={wi + "-" + key}
                                                    type="button"
                                                    title={`${count} ${count === 1 ? "entry" : "entries"} on ${format(day, "MMM d, yyyy")}`}
                                                    onClick={() => handleDayClick(day)}
                                                    className={cn(
                                                        "h-[11px] w-[11px] rounded-[2px] transition-colors outline-offset-1",
                                                        !inYear && "bg-transparent hover:bg-transparent cursor-default",
                                                        isSelected && "outline-2 outline-primary"
                                                    )}
                                                    style={inYear ? levelStyle(count) : undefined}
                                                    aria-label={format(day, "MMMM d, yyyy")}
                                                />
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 text-[11px] text-muted-foreground">
                        {totalEntries.toLocaleString()} entries in {year}
                        {yearEntries.length > 0 && ` · ${counts.size} active day${counts.size === 1 ? "" : "s"}`}
                    </div>
                </CardContent>
            </Card>

            {/* Full entries for the selected day */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">
                        {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a day"}
                    </h3>
                    {!loading && dayEntries && (
                        <span className="text-xs text-muted-foreground">
                            {dayEntries.length} {dayEntries.length === 1 ? "entry" : "entries"}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-10 border border-dashed rounded-lg text-muted-foreground">
                        <Loader2 className="h-6 w-6 mb-2 animate-spin opacity-40" />
                        <p className="text-xs italic">Loading entries...</p>
                    </div>
                ) : dayEntries && dayEntries.length > 0 ? (
                    <div className="space-y-6">
                        {dayEntries.map(entry => (
                            <Card key={entry.id} className="overflow-hidden">
                                <CardContent className="p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-semibold text-lg">{entry.title}</h4>
                                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                                {entry.journal?.color && (
                                                    <span
                                                        className="w-1.5 h-1.5 rounded-full"
                                                        style={{ backgroundColor: entry.journal.color }}
                                                    />
                                                )}
                                                <span>{entry.journal?.title}</span>
                                                {entry.mood && <span className="normal-case tracking-normal text-sm">{entry.mood}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button variant="ghost" size="sm" asChild>
                                                <a href={`/entries/${entry.id}`}>
                                                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                                    Open entry
                                                </a>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Full content render (TipTap, incl. PDF <object> -> iframe) */}
                                    <EntryViewer content={entry.content} />

                                    {entry.locationName && (
                                        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(entry.date), "MMMM d, yyyy")}
                                            <span className="mx-1">·</span>
                                            <span className="truncate max-w-[200px]">{entry.locationName}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-center text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-xs italic">
                            {selectedDate ? "No entries for this date." : "Click a day on the graph to see its entries."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
