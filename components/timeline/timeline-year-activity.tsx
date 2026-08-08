"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, isSameDay } from "date-fns"
import Link from "next/link"
import { ChevronLeft, ChevronRight, MessageSquare, MapPin } from "lucide-react"
import { ImageWithLoader } from "@/components/ui/image-with-loader"
import { cn } from "@/lib/utils"

interface TimelineYearActivityProps {
    entries: any[]
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** GitHub-style intensity levels keyed by entry count. */
function levelClass(count: number) {
    if (count === 0) return "bg-muted/60 hover:bg-muted"
    if (count <= 2) return "bg-emerald-300 hover:bg-emerald-400 dark:bg-emerald-400/60 dark:hover:bg-emerald-400/80"
    if (count <= 5) return "bg-emerald-400 hover:bg-emerald-500 dark:bg-emerald-500/70 dark:hover:bg-emerald-500/90"
    if (count <= 9) return "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600/80 dark:hover:bg-emerald-600"
    return "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
}

const LEGEND_COUNTS = [0, 2, 5, 9, 999]

export function TimelineYearActivity({ entries }: TimelineYearActivityProps) {
    const currentYear = new Date().getFullYear()
    const [year, setYear] = useState<number>(currentYear)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => new Date())

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

    const selectedDateEntries = useMemo(() => {
        if (!selectedDate) return []
        return entries.filter(entry => isSameDay(new Date(entry.date), selectedDate))
    }, [entries, selectedDate])

    const changeYear = (delta: number) => {
        const next = year + delta
        if (next > currentYear || next < minYear) return
        setYear(next)
        setSelectedDate(undefined)
    }

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
                            {LEGEND_COUNTS.map(c => (
                                <span key={c} className={cn("h-[11px] w-[11px] rounded-[2px]", levelClass(c))} />
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
                                                    onClick={() =>
                                                        setSelectedDate(new Date(year, day.getMonth(), day.getDate()))
                                                    }
                                                    className={cn(
                                                        "h-[11px] w-[11px] rounded-[2px] transition-colors",
                                                        !inYear && "bg-transparent hover:bg-transparent cursor-default",
                                                        inYear && levelClass(count),
                                                        isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                                                    )}
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

            {/* Entries for the selected day */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">
                        {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a day"}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                        {selectedDateEntries.length} {selectedDateEntries.length === 1 ? "entry" : "entries"}
                    </span>
                </div>

                {selectedDateEntries.length > 0 ? (
                    <div className="space-y-4">
                        {selectedDateEntries.map(entry => (
                            <Link key={entry.id} href={`/entries/${entry.id}`} className="block">
                                <Card className="hover:bg-muted/50 transition-colors group cursor-pointer">
                                    <CardContent className="p-3 flex flex-col gap-3">
                                        <div className="flex items-start gap-3">
                                            {entry.mood && (
                                                <span className="text-xl shrink-0 mt-0.5">{entry.mood}</span>
                                            )}
                                            <div className="flex flex-1 items-start justify-between gap-3 min-w-0">
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                                        {entry.title}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                                        <div
                                                            className="w-1.5 h-1.5 rounded-full"
                                                            style={{ backgroundColor: entry.journal.color }}
                                                        />
                                                        {entry.journal.title}
                                                    </div>
                                                </div>
                                                {entry.firstImage && (
                                                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border bg-muted">
                                                        <ImageWithLoader
                                                            src={entry.firstImage}
                                                            alt={entry.title}
                                                            className="h-full w-full object-cover"
                                                            containerClassName="h-full w-full"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-xs text-muted-foreground line-clamp-2">
                                            {entry.snippet}
                                        </div>

                                        {(entry.locationName || (entry.tags && entry.tags.length > 0)) && (
                                            <div className="flex flex-wrap gap-2 items-center text-[10px] text-muted-foreground pt-1 border-t mt-1">
                                                {entry.locationName && (
                                                    <span className="flex items-center gap-0.5 truncate max-w-[150px]">
                                                        <MapPin className="h-3 w-3 shrink-0" />
                                                        {entry.locationName}
                                                    </span>
                                                )}
                                                {entry.tags && entry.tags.map((tag: any) => (
                                                    <span key={tag.name} className="bg-muted px-1.5 py-0.5 rounded-full truncate max-w-[100px]">
                                                        #{tag.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </Link>
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
