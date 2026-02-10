"use client"

import { useState, useMemo } from "react"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { format, isSameDay, startOfDay } from "date-fns"
import Link from "next/link"
import { MessageSquare, MapPin } from "lucide-react"
import { getFirstImage, getContentSnippet } from "@/lib/editor-utils"
import { ImageWithLoader } from "@/components/ui/image-with-loader"
import { cn } from "@/lib/utils"

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
    const entryDates = useMemo(() => {
        return entries.map(entry => startOfDay(new Date(entry.date)))
    }, [entries])

    // Map dates to their first image (if any)
    const dateImageMap = useMemo(() => {
        const map = new Map<string, string>()
        entries.forEach(entry => {
            const date = new Date(entry.date)
            const dateKey = format(date, 'yyyy-MM-dd')
            if (!map.has(dateKey)) {
                // First check for attached images (from database relation)
                if (entry.images && entry.images.length > 0) {
                    map.set(dateKey, entry.images[0].url)
                } else {
                    // Fallback to embedded images in content
                    const img = getFirstImage(entry.content)
                    if (img) {
                        map.set(dateKey, img)
                    }
                }
            }
        })
        return map
    }, [entries])

    return (
        <div className="flex flex-col gap-6 md:grid md:grid-cols-[1fr_300px]">
            <Card className="p-3">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border-0 w-full"
                    modifiers={{
                        hasEntry: entryDates
                    }}
                    modifiersClassNames={{
                        hasEntry: "font-black text-primary border-2 border-primary/50 bg-primary/5 rounded-md"
                    }}
                    components={{
                        DayButton: (props: any) => {
                            const { day, children, ...rest } = props
                            const dateKey = format(day.date, 'yyyy-MM-dd')
                            const imageUrl = dateImageMap.get(dateKey)

                            return (
                                <CalendarDayButton day={day} {...rest}>
                                    {imageUrl && (
                                        <div className="absolute inset-0 z-0 rounded-md overflow-hidden">
                                            <ImageWithLoader
                                                src={imageUrl}
                                                alt=""
                                                className="object-cover transition-transform group-hover:scale-110 duration-500"
                                                containerClassName="absolute inset-0 z-[-1]"
                                            />
                                            <div className="absolute inset-0 bg-black/30" />
                                        </div>
                                    )}
                                    <span className={cn("z-10 relative", imageUrl && "text-white font-bold drop-shadow-md")}>
                                        {children}
                                    </span>
                                </CalendarDayButton>
                            )
                        }
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

                <div className="space-y-6">
                    {selectedDateEntries.length > 0 ? (
                        selectedDateEntries.map((entry) => (
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
                                                {getFirstImage(entry.content) && (
                                                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border bg-muted">
                                                        <ImageWithLoader
                                                            src={getFirstImage(entry.content)!}
                                                            alt={entry.title}
                                                            className="h-full w-full object-cover"
                                                            containerClassName="h-full w-full"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-xs text-muted-foreground line-clamp-2">
                                            {getContentSnippet(entry.content)}
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
