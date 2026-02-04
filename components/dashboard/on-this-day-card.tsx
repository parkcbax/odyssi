import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CalendarClock, ArrowRight } from "lucide-react"
import Link from "next/link"

interface OnThisDayCardProps {
    entries: any[]
}

export function OnThisDayCard({ entries }: OnThisDayCardProps) {
    const hasMemories = entries.length > 0

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <CalendarClock className="h-5 w-5 text-muted-foreground" />
                        On This Day
                    </CardTitle>
                    <span className="text-xs text-muted-foreground font-mono">
                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </span>
                </div>
                <CardDescription>
                    {hasMemories ? `You have ${entries.length} memories from years past.` : "No memories found for this day."}
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
                        <p className="text-sm px-4">Keep writing to build your library of memories!</p>
                        <Button variant="ghost" size="sm" className="mt-2" asChild>
                            <Link href="/entries/new">
                                Write an entry for today
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
