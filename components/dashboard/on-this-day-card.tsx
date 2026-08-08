"use client"

import { useState, useMemo, useRef, useEffect, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CalendarClock, ArrowRight, ChevronDown } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { useRouter, usePathname } from "next/navigation"

interface OnThisDayCardProps {
    entries: any[]
    /** Full date used to derive the selected month/day (initial = today). */
    initialDate?: Date
    /** Called when the user picks a different month/day. */
    onDateChange?: (month: number, day: number) => void
}

export function OnThisDayCard({ entries, initialDate, onDateChange }: OnThisDayCardProps) {
    const today = new Date()
    const router = useRouter()
    const pathname = usePathname()
    const [selected, setSelected] = useState<Date>(() => {
        const base = initialDate ? new Date(initialDate) : today
        // Only month/day matter; use the current year so the picker opens at today's year
        return new Date(today.getFullYear(), base.getMonth(), base.getDate())
    })

    // When the server re-renders with a new ?date= param, keep local state in sync
    useEffect(() => {
        if (initialDate) {
            const base = new Date(initialDate)
            const next = new Date(today.getFullYear(), base.getMonth(), base.getDate())
            setSelected(prev =>
                prev.getMonth() === next.getMonth() && prev.getDate() === next.getDate()
                    ? prev
                    : next
            )
        }
    }, [initialDate])

    // Format for <input type="date"> as YYYY-MM-DD
    const inputValue = useMemo(() => {
        const y = selected.getFullYear()
        const m = String(selected.getMonth() + 1).padStart(2, "0")
        const d = String(selected.getDate()).padStart(2, "0")
        return `${y}-${m}-${d}`
    }, [selected])

    const inputRef = useRef<HTMLInputElement>(null)

    const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value // YYYY-MM-DD
        if (!raw) return
        const [y, m, d] = raw.split("-").map(Number)
        if (!y || !m || !d) return
        // Only month/day matter; keep the current year
        const next = new Date(today.getFullYear(), m - 1, d)
        setSelected(next)
        onDateChange?.(m, d)
        // Navigate so the server recomputes the entries for the new month/day
        const param = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
        router.push(`${pathname}?date=${param}`)
    }

    const hasMemories = entries.length > 0
    const displayDate = format(selected, "MMMM d")
    const isToday =
        selected.getMonth() === today.getMonth() && selected.getDate() === today.getDate()

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 min-w-0">
                        <CalendarClock className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span className="truncate">On This Day</span>
                    </CardTitle>
                    <div className="relative shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground font-mono whitespace-nowrap h-8 px-2 gap-1"
                            onClick={() => inputRef.current?.showPicker()}
                        >
                            {displayDate}
                            <ChevronDown className="h-3 w-3 opacity-60" />
                        </Button>
                        <input
                            ref={inputRef}
                            type="date"
                            value={inputValue}
                            onChange={handleDateChange}
                            tabIndex={-1}
                            aria-label="Select month and day"
                            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                        />
                    </div>
                </div>
                <CardDescription>
                    {hasMemories
                        ? `You have ${entries.length} memories from years past.`
                        : isToday
                            ? "No memories found for today."
                            : "No memories found for this day."}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-6 pt-0">
                {hasMemories ? (
                    <div className="space-y-4 py-2">
                        {entries.map(entry => (
                            <Link key={entry.id} href={`/entries/${entry.id}`} className="block group">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-primary">
                                            {new Date(entry.date).getFullYear()}
                                        </span>
                                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <h4 className="text-sm font-medium line-clamp-1 group-hover:underline underline-offset-2">
                                        {entry.title}
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground">
                                        {entry.journal.title}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col justify-center items-center text-center text-muted-foreground space-y-4">
                        <div className="bg-muted rounded-full p-4 w-16 h-16 flex items-center justify-center mb-2">
                            <CalendarClock className="h-8 w-8 opacity-50" />
                        </div>
                        <p className="text-sm px-4">
                            {isToday
                                ? "Keep writing to build your library of memories!"
                                : "No memories found for this day."}
                        </p>
                        <Button variant="ghost" size="sm" className="mt-2" asChild>
                            <Link
                                href={
                                    isToday
                                        ? "/entries/new"
                                        : `/entries/new?date=${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`
                                }
                            >
                                {isToday ? "Write an entry for today" : "Write an entry for this day"}
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
