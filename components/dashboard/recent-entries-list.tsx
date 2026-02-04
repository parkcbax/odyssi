import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import Link from "next/link"
import { getContentSnippet } from "@/lib/editor-utils"
import { formatDistanceToNow } from "date-fns"

interface RecentEntriesListProps {
    entries: any[]
}

export function RecentEntriesList({ entries }: RecentEntriesListProps) {
    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    Recent Entries
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y relative min-h-[100px]">
                    {entries.length > 0 ? (
                        entries.map((entry) => (
                            <Link key={entry.id} href={`/entries/${entry.id}`}>
                                <div className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-medium group-hover:text-primary transition-colors">{entry.title}</h4>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(entry.date), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {getContentSnippet(entry.content)}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span
                                            className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                                            style={{ backgroundColor: entry.journal.color + '20', color: entry.journal.color }}
                                        >
                                            {entry.journal.title}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )
                        )) : (
                        <div className="p-8 text-center text-muted-foreground italic">
                            No entries yet. Start writing!
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
