import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { format } from "date-fns"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getContentSnippet, getFirstImage } from "@/lib/editor-utils"
import { ImageWithLoader } from "@/components/ui/image-with-loader"

interface TimelineListProps {
    entries: any[]
}

export function TimelineList({ entries }: TimelineListProps) {
    if (entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center text-muted-foreground min-h-[400px]">
                <p>No entries found. Start writing your story!</p>
            </div>
        )
    }

    // Group entries by month/year
    const groups: { [key: string]: typeof entries } = {}
    entries.forEach(entry => {
        const key = format(entry.date, 'MMMM yyyy')
        if (!groups[key]) groups[key] = []
        groups[key].push(entry)
    })

    return (
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
            {Object.entries(groups).map(([monthYear, monthEntries], monthIdx) => (
                <div key={monthYear} className="relative space-y-4">
                    <div className="md:flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20 py-2">
                        <div className="flex items-center space-x-2 md:space-x-4 md:w-1/2 md:justify-end">
                            <h2 className="text-lg font-bold text-primary">{monthYear}</h2>
                        </div>
                        <div className="hidden md:block w-10 shrink-0">
                            <div className="h-4 w-4 rounded-full border-4 border-background bg-primary mx-auto" />
                        </div>
                        <div className="md:w-1/2" />
                    </div>

                    {monthEntries.map((entry, idx) => (
                        <div key={entry.id} className="relative flex items-center justify-between md:justify-normal group">
                            {/* Line dot */}
                            <div className="absolute left-0 translate-y-0.5 md:left-1/2 md:-ml-2 flex items-center justify-center w-4 h-4 rounded-full border border-muted bg-background group-hover:border-primary transition-colors z-20">
                                <div className="w-1.5 h-1.5 rounded-full bg-muted group-hover:bg-primary transition-colors" />
                            </div>

                            <div className={`w-full md:w-[calc(50%-1.5rem)] ml-8 md:ml-0 ${idx % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'}`}>
                                <Link href={`/entries/${entry.id}`}>
                                    <Card className="hover:shadow-md transition-all group-hover:ring-1 ring-primary/20">
                                        <CardContent className="p-4">
                                            <div className="flex gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-muted-foreground">
                                                            {format(entry.date, 'EEE, MMM d')}
                                                        </span>
                                                        {entry.mood && (
                                                            <span className="text-lg">{entry.mood}</span>
                                                        )}
                                                    </div>
                                                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                                        {entry.title}
                                                    </h3>
                                                </div>
                                                {getFirstImage(entry.content) && (
                                                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                                                        <ImageWithLoader
                                                            src={getFirstImage(entry.content)!}
                                                            alt={entry.title}
                                                            className="h-full w-full object-cover"
                                                            containerClassName="h-full w-full"
                                                        />
                                                    </div>
                                                )}
                                                <Badge
                                                    variant="outline"
                                                    className="shrink-0 h-fit"
                                                    style={{
                                                        borderColor: entry.journal.color,
                                                        color: entry.journal.color
                                                    }}
                                                >
                                                    {entry.journal.title}
                                                </Badge>
                                            </div>

                                            {entry.content && (
                                                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                                    {getContentSnippet(entry.content)}
                                                </p>
                                            )}

                                            {entry.tags.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-1">
                                                    {entry.tags.map((tag: { id: string; name: string }) => (
                                                        <span key={tag.id} className="text-[10px] text-muted-foreground italic">
                                                            #{tag.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}

