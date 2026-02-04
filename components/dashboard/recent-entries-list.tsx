import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"

// Mock data
const recentEntries = [
    {
        id: 1,
        title: "Late Night Thoughts",
        date: "2 hours ago",
        preview: "Sometimes I wonder if the stars are looking back at us...",
        journal: "Personal"
    },
    {
        id: 2,
        title: "Project Kickoff",
        date: "Yesterday",
        preview: "We finally started the new Odyssi project. It's going to be...",
        journal: "Work"
    },
    {
        id: 3,
        title: "Coffee Shop Vibes",
        date: "2 days ago",
        preview: "The smell of roasted beans and the sound of rain...",
        journal: "Personal"
    }
]

export function RecentEntriesList() {
    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    Recent Entries
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {recentEntries.map((entry) => (
                        <div key={entry.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-medium group-hover:text-primary transition-colors">{entry.title}</h4>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">{entry.date}</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {entry.preview}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                    {entry.journal}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
