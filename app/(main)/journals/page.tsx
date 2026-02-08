import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { JournalDialog } from "@/components/journal-dialog"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Book } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function JournalsPage() {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const journalsData = await prisma.journal.findMany({
        where: { userId: session.user.id },
        include: {
            entries: {
                orderBy: { updatedAt: 'desc' },
                take: 1,
                select: { updatedAt: true }
            }
        }
    })

    // Sort by latest activity (either journal update or latest entry update)
    const journals = journalsData.map(journal => {
        const latestEntryDate = journal.entries[0]?.updatedAt
        const journalDate = journal.updatedAt
        // Use the most recent of the two
        const lastActive = latestEntryDate && latestEntryDate > journalDate
            ? latestEntryDate
            : journalDate

        return {
            ...journal,
            lastActive
        }
    }).sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime())

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Journals</h1>
                <JournalDialog />
            </div>
            {journals.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border bg-muted/50 border-dashed text-muted-foreground p-8 text-center min-h-[300px]">
                    <div className="p-4 bg-background rounded-full mb-4">
                        <Book className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-medium">No journals yet</h3>
                    <p className="text-sm text-muted-foreground mt-2 mb-4 max-w-sm">
                        Create your first journal to start documenting your journey.
                    </p>
                    <JournalDialog />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {journals.map((journal) => (
                        <Link key={journal.id} href={`/journals/${journal.id}`}>
                            <Card className="hover:bg-muted/50 transition-all cursor-pointer h-full group">
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                    <div
                                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm border transition-transform group-hover:scale-110"
                                        style={{ backgroundColor: (journal as any).color + '15', color: (journal as any).color }}
                                    >
                                        {(journal as any).icon || "📔"}
                                    </div>
                                    <div className="min-w-0">
                                        <CardTitle className="truncate">{journal.title}</CardTitle>
                                        <CardDescription className="line-clamp-1">{journal.description || "No description"}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <span
                                            className="h-2 w-2 rounded-full"
                                            style={{ backgroundColor: (journal as any).color }}
                                        />
                                        Last updated: {new Date(journal.lastActive).toLocaleDateString()}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
