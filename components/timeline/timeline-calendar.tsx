"use client"

import { useState, useMemo } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { format, isSameDay, startOfDay } from "date-fns"
import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { getFirstImage } from "@/lib/editor-utils"
import { ImageWithLoader } from "@/components/ui/image-with-loader"

interface TimelineCalendarProps {
    entries: any[]
}

export function TimelineCalendar({ entries }: TimelineCalendarProps) {
    const [date, setDate] = useState<Date | undefined>(new Date())

    // Filter entries for the selected date
    const selectedDateEntries = useMemo(() => {
        if (!date) return []
        return entries.filter(entry => isSameDay(new Date(entry.date), date))
    }, [date, entries])

    // Highlight dates with entries (normalized to start of day)
    const datesWithEntries = useMemo(() => {
        return entries.map(entry => startOfDay(new Date(entry.date)))
    }, [entries])

    return (
        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            <Card className="p-3">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border-0 w-full"
                    modifiers={{
                        hasEntry: datesWithEntries
                    }}
                    modifiersClassNames={{
                        hasEntry: "font-black text-primary border-2 border-primary/50 bg-primary/5 rounded-md"
                    }}
                />
            </Card>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">
                        {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                        {selectedDateEntries.length} {selectedDateEntries.length === 1 ? 'entry' : 'entries'}
                    </span>
                </div>

                <div className="space-y-3">
                    {selectedDateEntries.length > 0 ? (
                        selectedDateEntries.map((entry) => (
                            <Link key={entry.id} href={`/entries/${entry.id}`}>
                                <Card className="hover:bg-muted/50 transition-colors group cursor-pointer">
                                    <CardContent className="p-3 flex items-start gap-3">
                                        {entry.mood && (
                                            <span className="text-xl shrink-0 mt-0.5">{entry.mood}</span>
                                        )}
                                        <div className="flex flex-1 items-start justify-between gap-3 min-w-0">
                                            <div className="min-w-0">
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
                                            {getFirstImage(entry.content) && (
                                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border bg-muted">
                                                    <ImageWithLoader
                                                        src={getFirstImage(entry.content)!}
                                                        alt={entry.title}
                                                        className="h-full w-full object-cover"
                                                        containerClassName="h-full w-full"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-center text-muted-foreground">
                            <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-xs italic">No entries for this date.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
