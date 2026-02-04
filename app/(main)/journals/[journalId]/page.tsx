import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Calendar, MapPin, ChevronLeft, ImageIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getContentSnippet, getFirstImage } from "@/lib/editor-utils"

export default async function JournalDetailsPage({ params }: { params: Promise<{ journalId: string }> }) {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const { journalId } = await params

    const journal = await prisma.journal.findUnique({
        where: {
            id: journalId,
            userId: session.user.id
        },
        include: {
            entries: {
                orderBy: { date: 'desc' }
            }
        }
    })

    if (!journal) {
        notFound()
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/journals" className="hover:text-foreground flex items-center gap-1">
                        <ChevronLeft className="h-3 w-3" />
                        Journals
                    </Link>
                </div>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-sm border"
                            style={{ backgroundColor: journal.color + '20', color: journal.color }} // 20 for opacity
                        >
                            {journal.icon || "📔"}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{journal.title}</h1>
                            <p className="text-muted-foreground">{journal.description || "No description provided."}</p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href="/entries/new">
                            <Plus className="h-4 w-4 mr-2" />
                            New Entry
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="border-t pt-6">
                <h2 className="text-lg font-semibold mb-4">Entries ({journal.entries.length})</h2>
                {journal.entries.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                        <p className="text-muted-foreground">No entries yet.</p>
                        <Button variant="link" asChild className="mt-2">
                            <Link href="/entries/new">Write your first entry</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {journal.entries.map((entry) => (
                            <Link key={entry.id} href={`/entries/${entry.id}`}>
                                <Card className="hover:bg-muted/50 transition-colors h-full">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">{entry.title}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 text-xs">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(entry.date).toLocaleDateString()}
                                            </span>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-4">
                                            <div className="flex-1 space-y-2">
                                                <p className="text-sm text-muted-foreground line-clamp-3">
                                                    {getContentSnippet(entry.content)}
                                                </p>
                                            </div>
                                            {getFirstImage(entry.content) && (
                                                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted">
                                                    <img
                                                        src={getFirstImage(entry.content)!}
                                                        alt={entry.title}
                                                        className="h-full w-full object-cover transition-transform hover:scale-105"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
