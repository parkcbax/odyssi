import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Calendar, MapPin, Tag, Edit } from "lucide-react"
import { EntryViewer } from "@/components/entry-viewer"
import { EntryActions } from "@/components/entry-actions"

export const dynamic = 'force-dynamic'

export default async function EntryPage({ params }: { params: Promise<{ entryId: string }> }) {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const { entryId } = await params

    const entry = await prisma.entry.findUnique({
        where: {
            id: entryId,
            journal: {
                userId: session.user.id
            }
        },
        include: {
            journal: true,
            tags: true
        }
    })

    if (!entry) {
        notFound()
    }

    return (
        <div className="max-w-3xl mx-auto flex flex-col gap-6 py-6 px-4">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between print:hidden">
                    <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
                        <Link href={`/journals/${entry.journalId}`}>
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back to {entry.journal.title}
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <EntryActions
                            entryId={entry.id}
                            journalId={entry.journalId}
                            title={entry.title}
                            isPublic={entry.isPublic}
                            publicSlug={entry.publicSlug}
                            publicPassword={entry.publicPassword}
                            publicExpiresAt={entry.publicExpiresAt}
                        />
                    </div>
                </div>

                <div id="entry-printable-content" className="bg-background p-1 space-y-6">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">{entry.title}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                            {entry.locationName && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {entry.locationName}
                                </div>
                            )}
                            {entry.mood && (
                                <div className="flex items-center gap-1">
                                    <span className="text-base">{entry.mood}</span>
                                </div>
                            )}
                            {entry.tags.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <Tag className="h-4 w-4" />
                                    <div className="flex gap-1">
                                        {entry.tags.map(tag => (
                                            <span key={tag.id} className="bg-muted px-1.5 py-0.5 rounded-md text-xs">
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t pt-8">
                        {entry.content ? (
                            <EntryViewer content={entry.content} />
                        ) : (
                            <p className="text-muted-foreground italic">No content written.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
